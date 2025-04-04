import { FC } from "react";
import { UseFormRegister } from "react-hook-form";
import styles from "./Input.module.scss";

interface InputProps {
  label: string;
  name: string;
  type?: string;
  register: UseFormRegister<any>;
  error?: string;
}

const Input: FC<InputProps> = ({ label, name, type = "text", register, error }) => {
  return (
    <div className={styles.inputWrapper}>
      <label>{label}</label>
      <input {...register(name)} type={type} />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
};

export default Input;
