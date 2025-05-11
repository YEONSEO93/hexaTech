import { useState } from 'react';
import { Password } from 'primereact/password';
import passwordInputModule from './password-input.module.css';

const PasswordInput = ({ ...props }) => {
    const [value, setValue] = useState('');
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={props.name} className="text-sm font-medium text-gray-700">
                {props.label}
            </label>
            <Password value={value} onChange={(e) => setValue(e.target.value)} feedback={false} toggleMask {...props} className={passwordInputModule.custom} />
        </div>
    );
}

export default PasswordInput;