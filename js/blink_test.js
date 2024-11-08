document.addEventListener('DOMContentLoaded', function () {
    const videoElement = document.getElementById('video');
    const startButton = document.getElementById('start-btn');
    const blinkDisplay = document.getElementById('blink-display');
    const blinkCountDisplay = document.getElementById('blink-count');
    const timerDisplay = document.getElementById('timer-display');

    let blinkCount = 0;
    let timer = 60; // 1 minute timer
    let blinkFetchInterval;
    let timerInterval;

    const backendURL = 'https://backend-6-wyp8.onrender.com';  // Update this with your backend URL

    // Function to fetch the actual blink count from the server
    async function fetchBlinkCount() {
        try {
            const response = await fetch(`${backendURL}/get_blink_count`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            blinkCount = data.blinks_per_minute || 0; // Ensure blinkCount is a number
            console.log(blinkCount)
            blinkDisplay.innerText = `Blinks: ${blinkCount}`;
            blinkCountDisplay.innerText = `Blink count: ${blinkCount}`;
        } catch (error) {
            console.error('Error fetching blink count:', error);
        }
    }

    // Function to update timer
    function updateTimer() {
        timerInterval = setInterval(function () {
            if (timer > 0) {
                timer--;
                timerDisplay.innerText = `Time remaining: ${timer} seconds`;
            } else {
                clearInterval(timerInterval);
                clearInterval(blinkFetchInterval);
                alert('Blink detection finished!');
            }
        }, 1000);
    }

    // Event listener for the start button
    startButton.addEventListener('click', function (event) {
        event.preventDefault();

        // Reset blink count and timer
        blinkCount = 0;
        timer = 60;
        blinkDisplay.innerText = 'Blinks: 0';
        blinkCountDisplay.innerText = 'Blink count: 0';
        timerDisplay.innerText = 'Time remaining: 60 seconds';

        // Start the timer
        updateTimer();

        // Fetch blink count every second until timer runs out
        blinkFetchInterval = setInterval(function () {
            if (timer > 0) {
                fetchBlinkCount();
            } else {
                clearInterval(blinkFetchInterval);
            }
        }, 1000); // Fetch every second

        // Start blink detection
        startBlinkDetection();
    });

    // Function to start blink detection
    async function startBlinkDetection() {
        try {
            const response = await fetch(`${backendURL}/detect_blinks`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const stream = new ReadableStream({
                start(controller) {
                    function push() {
                        reader.read().then(({ done, value }) => {
                            if (done) {
                                controller.close();
                                return;
                            }
                            controller.enqueue(value);
                            push();
                        });
                    }
                    push();
                }
            });

            const responseStream = new Response(stream);
            const blob = await responseStream.blob();
            const url = URL.createObjectURL(blob);
            videoElement.src = url;
        } catch (error) {
            console.error('Error starting blink detection:', error);
        }
    }

    // Access the user's webcam
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                videoElement.srcObject = stream;
            })
            .catch(function (error) {
                console.error('Error accessing webcam:', error);
            });
    } else {
        console.error('Webcam not supported in this browser.');
    }
});
