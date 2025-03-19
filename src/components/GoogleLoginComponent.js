import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import GoogleFitData from "./GoogleFitData";

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const GoogleLoginComponent = () => {
    const [userData, setUserData] = useState(null);
    const [accessToken, setAccessToken] = useState(null);

    const handleSuccess = (response) => {
        const decoded = jwtDecode(response.credential);
        console.log("User Data:", decoded);
        setUserData(decoded);
        setAccessToken(response.credential);
    };

    const handleFailure = () => {
        console.log("Login Failed");
    };

    const handleLogout = () => {
        googleLogout();
        setUserData(null);
        setAccessToken(null);
    };

    return (
        <GoogleOAuthProvider clientId={CLIENT_ID}>
            <div>
                {!userData ? (
                    <GoogleLogin onSuccess={handleSuccess} onError={handleFailure} />
                ) : (
                    <div>
                        <h2>Welcome, {userData.name}!</h2>
                        <img src={userData.picture} alt="Profile" style={{ width: 100, borderRadius: "50%" }} />
                        <p>Email: {userData.email}</p>
                        <button onClick={handleLogout}>Logout</button>
                        {accessToken && <GoogleFitData token={accessToken} />}
                    </div>
                )}
            </div>
        </GoogleOAuthProvider>
    );
};

export default GoogleLoginComponent;
