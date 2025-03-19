import React, { useState, useEffect } from "react";
import { GoogleLogin, GoogleLogout } from "react-google-login";
import { gapi } from "gapi-script";

const CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"; // ضع Client ID الخاص بك هنا
const SCOPES = "https://www.googleapis.com/auth/fitness.activity.read profile email";

const GoogleFit = () => {
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [token, setToken] = useState("");
    const [stepCount, setStepCount] = useState(0);
    const [heartRate, setHeartRate] = useState(0);
    const [bloodPressure, setBloodPressure] = useState({ systolic: 0, diastolic: 0 });

    useEffect(() => {
        const initClient = () => {
            gapi.load("client:auth2", () => {
                gapi.client.init({
                    clientId: CLIENT_ID,
                    scope: SCOPES,
                }).then(() => {
                    const authInstance = gapi.auth2.getAuthInstance();
                    setIsSignedIn(authInstance.isSignedIn.get());
                    if (authInstance.isSignedIn.get()) {
                        const user = authInstance.currentUser.get();
                        setUserData(user.getBasicProfile()); // تخزين بيانات المستخدم
                        const accessToken = user.getAuthResponse().access_token;
                        setToken(accessToken);
                        fetchGoogleFitData(accessToken);
                    }
                });
            });
        };
        initClient();
    }, []);

    const onSuccess = (response) => {
        console.log("Login Success:", response);
        const user = response.profileObj;
        setUserData(user);
        setIsSignedIn(true);
        setToken(response.accessToken);
        fetchGoogleFitData(response.accessToken);
    };

    const onFailure = (error) => {
        console.log("Login Failed:", error);
    };

    const onLogoutSuccess = () => {
        setIsSignedIn(false);
        setUserData(null);
        setToken("");
        setStepCount(0);
        setHeartRate(0);
        setBloodPressure({ systolic: 0, diastolic: 0 });
    };

    const fetchGoogleFitData = async (token) => {
        try {
            const response = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    aggregateBy: [
                        { dataTypeName: "com.google.step_count.delta" },
                        { dataTypeName: "com.google.heart_rate.bpm" },
                        { dataTypeName: "com.google.blood_pressure" }
                    ],
                    bucketByTime: { durationMillis: 86400000 }, // بيانات آخر 24 ساعة
                    startTimeMillis: Date.now() - 86400000,
                    endTimeMillis: Date.now(),
                }),
            });

            const data = await response.json();
            console.log("Google Fit API Response:", data);

            if (!data.bucket) {
                console.error("No bucket data found.");
                return;
            }

            let totalSteps = 0;
            let avgHeartRate = 0;
            let heartRateCount = 0;
            let systolic = 0, diastolic = 0;

            data.bucket.forEach(bucket => {
                bucket.dataset?.forEach(dataset => {
                    if (dataset.dataSourceId?.includes("step_count") && dataset.point?.length > 0) {
                        totalSteps += dataset.point[0]?.value[0]?.intVal || 0;
                    }

                    if (dataset.dataSourceId?.includes("heart_rate") && dataset.point?.length > 0) {
                        dataset.point.forEach(point => {
                            avgHeartRate += point?.value[0]?.fpVal || 0;
                            heartRateCount++;
                        });
                    }

                    if (dataset.dataSourceId?.includes("blood_pressure") && dataset.point?.length > 0) {
                        systolic = dataset.point[0]?.value[0]?.fpVal || 0;
                        diastolic = dataset.point[0]?.value[1]?.fpVal || 0;
                    }
                });
            });

            setStepCount(totalSteps);
            setHeartRate(heartRateCount > 0 ? (avgHeartRate / heartRateCount).toFixed(2) : 0);
            setBloodPressure({ systolic, diastolic });
        } catch (error) {
            console.error("Error fetching Google Fit data:", error);
        }
    };

    return (
        <div>
            {!isSignedIn ? (
                <GoogleLogin
                    clientId={CLIENT_ID}
                    buttonText="Sign in with Google"
                    onSuccess={onSuccess}
                    onFailure={onFailure}
                    cookiePolicy={"single_host_origin"}
                    scope={SCOPES}
                />
            ) : (
                <>
                    <h2>Welcome, {userData?.name}!</h2>
                    <img src={userData?.imageUrl} alt="Profile" style={{ width: 100, borderRadius: "50%" }} />
                    <p>Email: {userData?.email}</p>

                    <h2>Steps Count: {stepCount}</h2>
                    <h2>Heart Rate: {heartRate} bpm</h2>
                    <h2>Blood Pressure: {bloodPressure.systolic}/{bloodPressure.diastolic} mmHg</h2>

                    <GoogleLogout
                        clientId={CLIENT_ID}
                        buttonText="Sign Out"
                        onLogoutSuccess={onLogoutSuccess}
                    />
                </>
            )}
        </div>
    );
};

export default GoogleFit;
