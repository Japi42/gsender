/*
base filtering and pagination code is from examples in https://tanstack.com/table/v8
*/

import React, { useState } from 'react';
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
} from '@tanstack/react-table';
import { rankItem } from '@tanstack/match-sorter-utils';

import 'bootstrap/dist/css/bootstrap.min.css';
import { Table as BTable } from 'react-bootstrap';
import styles from './index.css';

/*
    Columns must be in the format:
        [
            {
                accessorKey: 'insert whatever key you want here',
            },
        ]
    The documentation for this package is kind of confusing for the new v8, so I'll list the rest of the options I've used here:
        header/footer
            - params: none
            - return value: the header/footer for the column
        cell
            - params: info
            - return value: what goes in the cell
        size/minSize/maxSize
            - value: number
            - determines the size of the column
        invertSorting
            - value: boolean
            - default: false
            - inverts the default sorting for the column
        enableSorting
            - value: boolean
            - default: true
            - changes whether the user is allowed to click on the header to sort the column
        filterFn
            - value: function or key of predetermined functions
            - the function used to filter the entries in the table
            - (i just use 'fuzzy' every time)
        sortingFn
            - value: function
            - the function used to sort the rows in the column
            - (you can import sortingFns from '@tanstack/react-table' to use premade ones)
    I also have a custom property:
        disableColSpan
            - value: boolean
            - if this is enabled, the column span of the previous columns will stop at this column
                - ex. if you want the subrow to only span 2 columns, you can add disableColSpan to column 3
                        |--------|--------|----|
                        |Part    |Time    |Edit|
                        |-----------------|----|
                        |this is a subrow |    |
                        |-----------------|----|
                      this can set you up to do other cool things, like making column 3 span 2 rows using rowSpan!
                        |--------|--------|----|
                        |Part    |Time    |Edit|
                        |-----------------|    |
                        |this is a subrow |    |
                        |-----------------|----|
*/

const SortableTable = (props) => {
    // set defaults
    const data = props.data || []; // array of data objects
    const columns = props.columns || []; // format above
    const defaultData = props.defaultData || []; // same as data
    const height = props.height || '520px';
    const width = props.width || '760px';
    const enableSortingRemoval =
        props.enableSortingRemoval !== undefined
            ? props.enableSortingRemoval
            : true;
    /*
        const sortBy = [
            {
                id: 'time', // accessorKey
                desc: true
            }
        ];
    */
    const sortBy = props.sortBy || null;
    const rowColours = props.rowColours || [
        '#f9f9f9',
        'rgba(255, 255, 255, 0)',
    ]; // every other row colours
    const onAdd = props.onAdd || null; // function for when add button is pressed
    const rowSpan = props.rowSpan || new Map(); // map: accessorKey => num rows to span

    // stop col span from first col that has it disabled
    let stopIndex = 0;
    columns.forEach((col, i) => {
        if (col.disableColSpan) {
            stopIndex = i;
        }
    });

    const colSpanLength = stopIndex;

    /***** FUNCTIONS *****/
    const fuzzyFilter = (row, columnId, value, addMeta) => {
        // Rank the item
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const itemRank = rankItem(row.getValue(columnId), value);

        // Store the itemRank info
        addMeta({
            itemRank,
        });

        // Return if the item should be filtered in/out
        return itemRank.passed;
    };

    /***** CONSTANTS *****/
    const [pageNum, setPageNum] = useState(1);
    const [globalFilter, setGlobalFilter] = useState('');
    const [globalSearchText, setGlobalSearchText] = useState('');
    const [sorting, setSorting] = useState(sortBy);

    /***** TABLE DATA *****/
    // table variable
    const table = useReactTable({
        data: data || defaultData,
        columns: columns,
        filterFns: {
            fuzzy: fuzzyFilter,
        },
        state: {
            globalFilter,
            sorting,
        },
        initialState: {
            pagination: {
                pageSize: 15,
                pageIndex: 0,
            },
        },
        onSortingChange: setSorting,
        enableSortingRemoval: enableSortingRemoval,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: fuzzyFilter,
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
    });

    const currentPage = table.getState().pagination.pageIndex + 1;
    const maxPages = table.getPageCount();

    /***** RENDERING *****/
    return (
        <div
            className="container flex flex-col items-center justify-center gap-3 px-4 py-16 "
            style={{ maxWidth: width, marginBottom: '0px', padding: 0 }}
        >
            {/*** PAGINATION ***/}
            {/*** GLOBAL SEARCH ***/}
            <div
                className={[
                    'flex items-center gap-2',
                    styles.navContainer,
                ].join(' ')}
                style={{ marginBottom: '5px' }}
            >
                <input
                    value={globalSearchText ?? ''}
                    onChange={(e) => {
                        setGlobalSearchText(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setGlobalFilter(globalSearchText);
                        }
                    }}
                    className="font-lg border-block border p-2 shadow"
                    placeholder="Search all columns..."
                />
                {onAdd && (
                    <div
                        className="flex items-center gap-1"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            float: 'right',
                        }}
                    >
                        <button title="Add New" onClick={onAdd}>
                            Add New <i className="fas fa-plus" />
                        </button>
                    </div>
                )}
            </div>
            {/*** TABLE ***/}
            <div
                style={{
                    maxHeight: height,
                    minHeight: height,
                    marginBottom: '5px',
                    overflowY: 'scroll',
                }}
            >
                <BTable
                    striped
                    bordered
                    hover
                    size="sm"
                    variant="dark"
                    style={{ tableLayout: 'fixed' }}
                >
                    <thead>
                        {table.getHeaderGroups().map(
                            (
                                headerGroup, // we currently only have 1 group
                            ) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            style={{
                                                width: header.getSize(),
                                                whiteSpace: 'unset',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {header.isPlaceholder ? null : (
                                                <>
                                                    <div
                                                        {...{
                                                            className:
                                                                header.column.getCanSort()
                                                                    ? 'cursor-pointer select-none'
                                                                    : '',
                                                            onClick:
                                                                header.column.getToggleSortingHandler(),
                                                        }}
                                                    >
                                                        {flexRender(
                                                            header.column
                                                                .columnDef
                                                                .header,
                                                            header.getContext(),
                                                        )}
                                                        {{
                                                            asc: ' 🔼',
                                                            desc: ' 🔽',
                                                        }[
                                                            header.column
                                                                .getIsSorted()
                                                                .toString()
                                                        ] ?? null}
                                                    </div>
                                                </>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ),
                        )}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row, i) => {
                            return (
                                <React.Fragment key={row.id + 'parent'}>
                                    <tr
                                        key={row.id}
                                        style={{
                                            backgroundColor: rowColours[i % 2],
                                        }}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                rowSpan={
                                                    rowSpan.get(
                                                        cell.column.columnDef
                                                            .accessorKey,
                                                    ) || 1
                                                }
                                                style={{
                                                    whiteSpace: 'unset',
                                                    overflowWrap: 'break-word',
                                                }}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                    {row.original.subRow && (
                                        <tr
                                            key={row.id + 'subRow'}
                                            style={{
                                                backgroundColor:
                                                    rowColours[i % 2],
                                            }}
                                        >
                                            <td
                                                colSpan={colSpanLength}
                                                style={{
                                                    whiteSpace: 'pre-line',
                                                    overflowWrap: 'break-word',
                                                }}
                                            >
                                                {row.original.subRow}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </BTable>
            </div>
            {/* buttons */}
            <div
                className={[
                    'flex items-center gap-2',
                    styles.navContainer,
                ].join(' ')}
            >
                <button
                    className="rounded border p-1"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                    display={currentPage > 1 ? 'block' : 'hidden'}
                >
                    {'<<'}
                </button>
                <button
                    className="rounded border p-1"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    display={currentPage > 1 ? 'block' : 'hidden'}
                >
                    {'<'}
                </button>
                <button
                    className="rounded border p-1"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    display={currentPage < maxPages ? 'block' : 'hidden'}
                >
                    {'>'}
                </button>
                <button
                    className="rounded border p-1"
                    onClick={() => table.setPageIndex(maxPages - 1)}
                    disabled={!table.getCanNextPage()}
                    display={currentPage < maxPages ? 'block' : 'hidden'}
                >
                    {'>>'}
                </button>
                {/* label */}
                <span
                    className="flex items-center gap-1"
                    style={{ marginLeft: '10px' }}
                >
                    {'Page '}
                    <strong>
                        {currentPage} of {maxPages}
                    </strong>
                </span>
                {/* jump to page */}
                <div
                    className="flex items-center gap-1"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        float: 'right',
                    }}
                >
                    <span style={{ marginRight: '5px' }}>
                        {'Jump to page: '}
                        <input
                            type="number"
                            defaultValue={currentPage}
                            onChange={(e) => {
                                setPageNum(
                                    e.target.value
                                        ? Number(e.target.value) - 1
                                        : 0,
                                );
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    table.setPageIndex(pageNum);
                                }
                            }}
                            className={[
                                'w-16 rounded border p-1 ',
                                styles.input,
                            ].join(' ')}
                            min="1"
                            max={maxPages}
                            style={{ minWidth: '60px' }}
                        />
                    </span>
                    <div style={{ marginRight: '5px' }}>|</div>
                    {/*** PAGE SIZE ***/}
                    <div>
                        {'Entries/Page: '}
                        <select
                            value={table.getState().pagination.pageSize}
                            onChange={(e) => {
                                table.setPageSize(Number(e.target.value));
                            }}
                        >
                            {[15, 30, 50, 75, 100].map((pageSize) => (
                                <option key={pageSize} value={pageSize}>
                                    Show {pageSize}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SortableTable;
