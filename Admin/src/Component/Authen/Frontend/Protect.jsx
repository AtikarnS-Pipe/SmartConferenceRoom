import React from 'react'
import {Navigate} from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

function Protect({ children }) {

    const token = localStorage.getItem('token');
    console.log("Token from localStorage:", token);

    if (token && token.split('.').length === 3) {
        try{
            const decodedToken = jwtDecode(token);
            
            const currentTime = Date.now() / 1000; // Current time in seconds

            if (decodedToken.exp > currentTime) {
                return children; // Token is valid, render the children components
            } else{
                localStorage.removeItem('token'); // Token expired, remove it
            }
        } catch (error) {
            console.error("Invalid Token:", error);
        }
    } 

    return <Navigate to= '/' />

}

export default Protect