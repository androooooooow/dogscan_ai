import axios from 'axios';

const api = axios.create({
    // ✅ CHANGE THIS to your PC's IP address
    // Use the one that showed up in your terminal (192.168.100.240)
    baseURL: 'http://192.168.100.240:5000', 
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

export default api;