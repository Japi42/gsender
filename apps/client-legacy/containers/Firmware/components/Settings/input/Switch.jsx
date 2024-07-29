import React from 'react';

import ToggleSwitch from 'app/components/ToggleSwitch';

import styles from './index.styl';

const Switch = ({ value, onChange, disabled }) => {
    const checked = !!Number(value);

    return (
        <div className={styles.switch}>
            <div className={styles.disable}>Disabled</div>
            <ToggleSwitch
                checked={checked}
                onChange={(value) => {
                    onChange(Number(value).toString());
                }}
                disabled={disabled}
            />
            <div className={styles.enable}>Enabled</div>
        </div>
    );
};

export default Switch;
