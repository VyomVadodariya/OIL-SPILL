import React from 'react';
import './Input.css';

/* ---- Text Input ---- */

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  mono?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      size = 'md',
      mono = false,
      leftIcon,
      rightIcon,
      className = '',
      wrapperClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    const wrapperClasses = [
      'input-group',
      size !== 'md' ? `input-${size}` : '',
      mono ? 'input-mono' : '',
      error ? 'input-error' : '',
      wrapperClassName,
    ]
      .filter(Boolean)
      .join(' ');

    const innerClasses = [
      'input-wrapper',
      leftIcon ? 'input-has-left-icon' : '',
      rightIcon ? 'input-has-right-icon' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <div className={innerClasses}>
          {leftIcon && (
            <span className="input-icon-left" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`input ${className}`}
            {...props}
          />
          {rightIcon && (
            <span className="input-icon-right" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </div>
        {error ? (
          <span className="input-error-msg" role="alert">{error}</span>
        ) : hint ? (
          <span className="input-hint">{hint}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

/* ---- Select ---- */

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, size = 'md', wrapperClassName = '', id, children, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const wrapperClasses = [
      'input-group',
      size !== 'md' ? `input-${size}` : '',
      error ? 'input-error' : '',
      wrapperClassName,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={selectId} className="input-label">
            {label}
          </label>
        )}
        <select ref={ref} id={selectId} className="select" {...props}>
          {children}
        </select>
        {error ? (
          <span className="input-error-msg">{error}</span>
        ) : hint ? (
          <span className="input-hint">{hint}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';

/* ---- Textarea ---- */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, wrapperClassName = '', id, ...props }, ref) => {
    const generatedId = React.useId();
    const taId = id || generatedId;
    return (
      <div className={`input-group ${error ? 'input-error' : ''} ${wrapperClassName}`}>
        {label && (
          <label htmlFor={taId} className="input-label">
            {label}
          </label>
        )}
        <textarea ref={ref} id={taId} className="textarea" {...props} />
        {error ? (
          <span className="input-error-msg">{error}</span>
        ) : hint ? (
          <span className="input-hint">{hint}</span>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
