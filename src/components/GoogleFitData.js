import React, { useState, useEffect } from "react";

const GoogleFitData = ({ token }) => {
    const [stepCount, setStepCount] = useState(0);
    const [heartRate, setHeartRate] = useState(0);
    const [bloodPressure, setBloodPressure] = useState({ systolic: 0, diastolic: 0 });

    useEffect(() => {
        const fetchGoogleFitData = async () => {
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
                    bucketByTime: { durationMillis: 86400000 },
                    startTimeMillis: Date.now() - 86400000,
                    endTimeMillis: Date.now(),
                }),
            });

            const data = await response.json();
            console.log("Google Fit Data:", data);

            let totalSteps = 0;
            let avgHeartRate = 0;
            let heartRateCount = 0;
            let systolic = 0, diastolic = 0;

            if (data.bucket) {
                data.bucket.forEach(bucket => {
                    bucket.dataset.forEach(dataset => {
                        if (dataset.dataSourceId.includes("step_count") && dataset.point.length > 0) {
                            totalSteps += dataset.point[0].value[0].intVal;
                        }

                        if (dataset.dataSourceId.includes("heart_rate") && dataset.point.length > 0) {
                            dataset.point.forEach(point => {
                                avgHeartRate += point.value[0].fpVal;
                                heartRateCount++;
                            });
                        }

                        if (dataset.dataSourceId.includes("blood_pressure") && dataset.point.length > 0) {
                            systolic = dataset.point[0].value[0].fpVal;
                            diastolic = dataset.point[0].value[1].fpVal;
                        }
                    });
                });
            }

            setStepCount(totalSteps);
            setHeartRate(heartRateCount > 0 ? (avgHeartRate / heartRateCount).toFixed(2) : 0);
            setBloodPressure({ systolic, diastolic });
        };

        fetchGoogleFitData();
    }, [token]);

    return (
        <div>
            <h2>Steps Count: {stepCount}</h2>
            <h2>Heart Rate: {heartRate} bpm</h2>
            <h2>Blood Pressure: {bloodPressure.systolic}/{bloodPressure.diastolic} mmHg</h2>
        </div>
    );
};

export default GoogleFitData;
