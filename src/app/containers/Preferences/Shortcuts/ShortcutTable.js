import uniqueId from 'lodash/uniqueId';
import React, { useEffect, useState } from 'react';
import store from '../../../store';
import styles from './shortcutTable.styl';

function ShortcutTable({ forwardRef }) {
    const [shortcuts, setShortcuts] = useState([{}]);

    useEffect(() => {
        setShortcuts(store.get('commandKeys'));
    }, []);

    return (
        <div className={styles.shortcutWrapper} ref={forwardRef}>
            <div className={styles.table}>
                <table>
                    <thead>
                        <tr>
                            <th>Action</th>
                            <th>Shortcut</th>
                            <th>Category</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shortcuts.map((shortcut, i) => {
                            const { title, keys, category } = shortcut;
                            return keys ? (
                                <tr key={`${title}-${uniqueId()}`}>
                                    <td>{title || '-'}</td>
                                    <td>{keys || '-'}</td>
                                    <td>{category || '-'}</td>
                                </tr>
                            ) : null;
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ShortcutTable;
