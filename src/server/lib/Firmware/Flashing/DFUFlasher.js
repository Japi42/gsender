/* eslint no-await-in-loop: 0 */

import DFU from './DFU';
import MemoryMap from 'nrf-intel-hex';
import logger from '../../logger';
import events from 'events';

//const VALID_VENDOR_IDS = [0x0483];
//const VALID_DEVICE_ID = [0x441];
//const START_ADDRESS = 0x08000000;

/*
  10:53:45 : erasing sector 0000 @: 0x08000000 done
  10:53:46 : erasing sector 0001 @: 0x08004000 done
  10:53:46 : erasing sector 0002 @: 0x08008000 done
  10:53:46 : erasing sector 0003 @: 0x0800c000 done
  10:53:47 : erasing sector 0004 @: 0x08010000 done
  10:53:49 : erasing sector 0005 @: 0x08020000 done

  Sector Sizes:
  0x08000000 16k
  0x08004000 16k
  0x08008000 16k
  0x0800c000 16k
  0x08010000 64k
  0x08020000 128k+
 */

const log = logger('DFUFlasher');

class DFUFlasher extends events.EventEmitter {
    SET_ADDRESS = 0x21;
    ERASE_PAGE = 0x41;
    XFER_SIZE = 2048; // we evaluate this

    constructor({ hex, ...options }) {
        super();
        this.options = options;
        this.hex = Buffer.from(hex, 'utf-8').toString();
        this.dfu = new DFU(this.path, options);
    }

    async flash() {
        await this.dfu.open();
        this.map = this.parseHex(this.hex);
        let startAddress = null;

        for (let [address, dataBlock] of this.map) {
            this.emit(
                'info',
                `Writing block of size ${dataBlock.byteLength} at address 0x${address.toString(16)}`,
            );
            if (!startAddress) {
                startAddress = address;
            }
            await this.download(address, this.XFER_SIZE, dataBlock);
        }

        log.info(`Jumping back to start address ${startAddress} to manifest`);
        await this.sendDFUCommand(this.SET_ADDRESS, startAddress, 4);
        const status = await this.dfu.getStatus();
        log.info(status);
        await this.dfu.download(new ArrayBuffer(0), 0);
        try {
            await this.dfu.pollUntil((state) => state === this.dfu.dfuMANIFEST);
        } catch (error) {
            this.emit('error', error);
        }

        await this.dfu.close();
        this.emit('end');
    }

    /**
     * Returns parsed data from either string path or file blob
     * @returns {Buffer|*}
     */
    parseHex() {
        try {
            return MemoryMap.fromHex(this.hex);
        } catch (err) {
            throw err;
        }
    }

    async download(startAddress, xferSize, data, manifestTolerant) {
        log.info('Starting download to board');

        let bytesSent = 0;
        let expectedSize = data.byteLength;
        let chunks = 1;

        await this.dfu.abortToIdle();
        log.info('Aborted to IDLE state');

        let address = startAddress;
        while (bytesSent < expectedSize) {
            const bytesLeft = expectedSize - bytesSent;
            const chunkSize = Math.min(bytesLeft, xferSize);

            let bytesWritten = 0;
            let dfuStatus;
            try {
                await this.sendDFUCommand(this.SET_ADDRESS, address, 4);
                const status = await this.dfu.getStatus();
                log.info(status);
                bytesWritten = await this.dfu.download(
                    data.slice(bytesSent, bytesSent + chunkSize),
                    2,
                );
                log.info(`Sent ${bytesWritten} bytes`);
                this.emit(
                    'info',
                    `Wrote chunk ${chunks} with size ${bytesWritten}b`,
                );
                dfuStatus = await this.dfu.pollUntilIdle(
                    this.dfu.dfuDNLOAD_IDLE,
                );
                address += chunkSize;
                chunks += 1;
            } catch (e) {
                log.error(e);
                this.emit('error', `Error during download: ${e}`);
            }

            if (dfuStatus.status !== this.dfu.STATUS_OK) {
                this.emit(
                    'error',
                    `DFU DOWNLOAD failed state=${dfuStatus.state}, status=${dfuStatus.status}`,
                );
            }

            bytesSent += bytesWritten;
            this.logProgress(bytesSent, expectedSize);
        }
        log.info('Finished download chunk');
    }

    /**
     * Return buffer from string of hex characters
     * @param line string hex value
     * @returns {Buffer}
     */
    hexStringToByte(line) {
        return Buffer.from([parseInt(line, 16)]);
    }

    getSectorStart(addr, segment) {
        const sectorIndex = Math.floor(
            (addr - segment.start) / segment.sectorSize,
        );
        return segment.start + sectorIndex * segment.sectorSize;
    }

    getSectorEnd(addr, segment) {
        const sectorIndex = Math.floor(
            (addr - segment.start) / segment.sectorSize,
        );
        return segment.start + (sectorIndex + 1) * segment.sectorSize;
    }

    logProgress(value, total) {
        this.emit('progress', value, total);
    }

    async erase(startAddr, length) {
        let segment = this.dfu.getSegment(startAddr);
        if (!segment) {
            this.emit('error', 'Invalid segment in memory map');
            log.error(`Unable to find valid segment for address ${startAddr}`);
            return;
        }
        let endAddr = this.getSectorStart(startAddr, segment);
        let addr = this.getSectorEnd(startAddr + length - 1, segment);

        let bytesErased = 0;
        const bytesToErase = endAddr - addr;

        while (addr < endAddr) {
            if (segment.end <= addr) {
                segment = this.getSegment(addr);
            }
            if (!segment.eraseable) {
                bytesErased = Math.min(
                    bytesErased - segment.end - addr,
                    bytesToErase,
                );
                addr = segment.end;
                this.logProgress(bytesErased, bytesToErase);
                continue;
            }
            const sectorIndex = Math.floor(
                (addr - segment.start) / segment.sectorSize,
            );
            const sectorAddr = segment.start + sectorIndex * segment.sectorSize;
            // eslint-disable-next-line no-await-in-loop
            await this.sendDFUCommand(this.ERASE_PAGE, sectorAddr, 4);
            addr = sectorAddr + segment.sectorSize;
            bytesErased += segment.sectorSize;
            this.logProgress(bytesErased, bytesToErase);
            log.info(`Erased ${bytesErased} of ${bytesToErase} bytes`);
        }
    }

    async sendDFUCommand(command, param = 0x00, len = 1) {
        // Array buffer codec for command to send
        let payload = new ArrayBuffer(len + 1);
        const dv = new DataView(payload);
        dv.setUint8(0, command);

        if (len === 1) {
            dv.setUint8(1, param);
        } else if (len === 4) {
            dv.setUint32(1, param, true);
        } else {
            this.emit(
                'error',
                `Invalid length of ${len} specified - must be 1 or 4`,
            );
            return;
        }

        try {
            await this.dfu.download(payload, 0);
        } catch (err) {
            log.error(err);
            this.emit('error', `Error during DFU command ${command}`);
            return;
        }

        // Poll status
        log.info('Poll status');
        let status = await this.dfu.pollUntil(
            (state) => state !== DFU.dfuDNBUSY,
        );
        if (status.status !== this.dfu.STATUS_OK) {
            this.emit('error', 'Special DfuSe command ' + command + ' failed');
        }
    }
}

export default DFUFlasher;
