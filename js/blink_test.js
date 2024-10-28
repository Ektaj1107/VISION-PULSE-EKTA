// document.addEventListener('DOMContentLoaded', () => {
//     let timerInterval;
//     let blinkUpdateInterval;
//     let isRunning = false;

//     const startBtn = document.getElementById('start-btn');
//     const video = document.getElementById('video');
//     const blinkCountDisplay = document.getElementById('blink-count');
//     const blinkDisplay = document.getElementById('blink-display');
//     const timerDisplay = document.getElementById('timer-display');

//     startBtn.addEventListener('click', async (event) => {
//         event.preventDefault();
        
//         if (isRunning) {
//             await stopDetection();
//         }
        
//         try {
//             isRunning = true;
//             startBtn.textContent = 'Stop Detection';

//             // Reset displays
//             blinkCountDisplay.innerText = 'Blink count: 0';
//             blinkDisplay.innerText = 'Blinks: 0';
//             timerDisplay.innerText = 'Timer: 60';

//             // Start detection on backend
//             const response = await fetch('http://127.0.0.1:5000/start_detection');
//             if (!response.ok) throw new Error('Failed to start detection');

//             // Set video source with timestamp to prevent caching
//             video.src = http://127.0.0.1:5000/video_feed?t=${new Date().getTime()};
//             video.style.display = 'block';

//             // Start timer and blink count updates
//             startTimer();
//             startBlinkUpdates();

//         } catch (err) {
//             console.error('Error starting detection:', err);
//             await stopDetection();
//         }
//     });

//     function startTimer() {
//         let seconds = 60;
//         timerDisplay.innerText = Timer: ${seconds};
        
//         clearInterval(timerInterval);
//         timerInterval = setInterval(() => {
//             seconds--;
//             timerDisplay.innerText = Timer: ${seconds};
            
//             if (seconds === 0) {
//                 stopDetection();
//             }
//         }, 1000);
//     }

//     function startBlinkUpdates() {
//         clearInterval(blinkUpdateInterval);
//         blinkUpdateInterval = setInterval(async () => {
//             try {
//                 const response = await fetch('http://127.0.0.1:5000/get_blink_count');
//                 const data = await response.json();
                
//                 blinkCountDisplay.innerText = Blink count: ${data.blinks};
//                 blinkDisplay.innerText = Blinks: ${data.blinks};
                
//             } catch (err) {
//                 console.error('Error updating blink count:', err);
//             }
//         }, 500); // Update every 500ms for smoother display
//     }

//     async function stopDetection() {
//         isRunning = false;
//         startBtn.textContent = 'Start Detection';
        
//         clearInterval(timerInterval);
//         clearInterval(blinkUpdateInterval);
        
//         video.style.display = 'none';
//         video.src = '';

//         try {
//             await fetch('http://127.0.0.1:5000/stop_detection');
//         } catch (err) {
//             console.error('Error stopping detection:', err);
//         }
//     }

//     // Clean up when the page is closed or refreshed
//     window.addEventListener('beforeunload', async () => {
//         if (isRunning) {
//             await stopDetection();
//         }
//     });
// });

// document.addEventListener('DOMContentLoaded', () => {
//     const startButton = document.getElementById('start-btn');
//     if (!startButton) {
//         console.error("Button not found");
//         return;
//     }
//     console.log("Button found");
    
//     // Start blink detection on button click
//     startButton.addEventListener('click', () => {
//         console.log("Button Clicked");
//         // Remaining code
//     });
// });


// document.addEventListener('DOMContentLoaded', function() {
//     const videoElement = document.getElementById('video');
//     const startButton = document.getElementById('start-btn');
//     const blinkDisplay = document.getElementById('blink-display');
//     const blinkCountDisplay = document.getElementById('blink-count');
//     const timerDisplay = document.getElementById('timer-display');

//     let blinkCount = 0;
//     let timer = 60;  // 1 minute timer

//     // Function to simulate blink counting (replace this with real detection logic)
//     function simulateBlinkDetection() {
//         blinkCount++;
//         blinkDisplay.innerText = 'Blinks: ' + blinkCount;
//         blinkCountDisplay.innerText = 'Blink count: ' + blinkCount;
//     }

//     // Function to update timer
//     function updateTimer() {
//         const interval = setInterval(function() {
//             if (timer > 0) {
//                 timer--;
//                 timerDisplay.innerText = Time remaining: ${timer} seconds;
//             } else {
//                 clearInterval(interval);
//                 alert('Blink detection finished!');
//             }
//         }, 1000);
//     }

//     // Event listener for the start button
//     startButton.addEventListener('click', function() {
//         event.preventDefault();
//         blinkCount = 0;  // Reset blink count
//         timer = 60;      // Reset timer
//         blinkDisplay.innerText = 'Blinks: 0';
//         blinkCountDisplay.innerText = 'Blink count: 0';
//         timerDisplay.innerText = 'Time remaining: 60 seconds';
        
//         // Start the timer
//         updateTimer();

//         // Simulate blink detection (replace with real detection)
//         const blinkInterval = setInterval(function() {
//             if (timer > 0) {
//                 simulateBlinkDetection();
//             } else {
//                 clearInterval(blinkInterval); // Stop the blink simulation
//             }
//         }, 3000);  // Simulates a blink every 3 seconds
//     });

//     // Access the user's webcam
//     if (navigator.mediaDevices.getUserMedia) {
//         navigator.mediaDevices.getUserMedia({ video: true })
//             .then(function(stream) {
//                 videoElement.srcObject = stream;
//             })
//             .catch(function(error) {
//                 console.error('Error accessing webcam:', error);
//             });
//     } else {
//         console.error('Webcam not supported in this browser.');
//     }
// });

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

    // Function to fetch the actual blink count from the server
    async function fetchBlinkCount() {
        try {
            const response = await fetch('http://127.0.0.1:5000/get_blink_count');
            
            if (!response.ok) {
                throw new Error(HTTP error! status: ${response.status});
            }

            const data = await response.json();
            blinkCount = data.blinks_per_minute || 0; // Ensure blinkCount is a number
            blinkDisplay.innerText = Blinks: ${blinkCount};
            blinkCountDisplay.innerText = Blink count: ${blinkCount};
        } catch (error) {
            console.error('Error fetching blink count:', error);
        }
    }

    // Function to update timer
    function updateTimer() {
        timerInterval = setInterval(function () {
            if (timer > 0) {
                timer--;
                timerDisplay.innerText = Time remaining: ${timer} seconds;
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
    });

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