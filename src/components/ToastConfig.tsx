import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ToastConfig = () => {
    return <ToastContainer position="top-right" autoClose={5000} hideProgressBar />;
};

export default ToastConfig;
