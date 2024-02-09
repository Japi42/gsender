import config from '../services/configstore';
import { ERR_INTERNAL_SERVER_ERROR } from '../constants';

const CONFIG_KEY = 'alarmList';

const getAlarmList = () => {
    const alarmList = config.get(CONFIG_KEY, { list: [] });
    return alarmList;
};

export const fetch = (req, res) => {
    const alarmList = getAlarmList();
    res.send(alarmList);
};

export const update = (req, res) => {
    const alarmList = req.body;
    try {
        config.set(CONFIG_KEY, alarmList);
        res.send({ message: 'alarms/errors saved' });
    } catch (err) {
        res.status(ERR_INTERNAL_SERVER_ERROR).send({
            msg: 'Failed to save settings' + JSON.stringify(alarmList.rcfile),
        });
    }
};
