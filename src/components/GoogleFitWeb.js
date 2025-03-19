import { useEffect } from "react";
import { gapi } from "gapi-script";

const CLIENT_ID = "285060101247-2msjne2pfqiesa2tqksvullu6ajrakef.apps.googleusercontent.com"; // Replace with your actual Client ID
const API_KEY = "AIzaSyCTAZT2UnkjBQ9BtAW0EAF99ehpuVLjpYs"; // Replace with your actual API Key
const SCOPES = "https://www.googleapis.com/auth/fitness.activity.read";

const GoogleFitWeb = () => {
    useEffect(() => {
        function start() {
            gapi.client.init({
                apiKey: API_KEY,
                clientId: CLIENT_ID,
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest"],
                scope: SCOPES,
            });
        }
        gapi.load("client:auth2", start);
    }, []);

    const signIn = () => {
        gapi.auth2.getAuthInstance().signIn().then(() => {
            getGoogleFitData();
        });
    };

    const getGoogleFitData = async () => {
        const response = await gapi.client.fitness.users.dataset.aggregate({
            userId: "me",
            requestBody: {
                aggregateBy: [{ dataTypeName: "com.google.step_count.delta" }],
                bucketByTime: { durationMillis: 86400000 },
                startTimeMillis: new Date().setHours(0, 0, 0, 0),
                endTimeMillis: new Date().getTime(),
            },
        });

        console.log("Google Fit Data:", response.result);
    };

    return (
        <div>
            <h2>Google Fit Web Integration</h2>
            <button onClick={signIn}>Sign in with Google Fit</button>
        </div>
    );
};

export default GoogleFitWeb;