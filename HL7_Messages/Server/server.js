const net = require('net');

// TCP server to receive data from the client
const tcpServer = net.createServer(socket => {
    console.log('Client connected');

    // Temporary variables to store received data
    let receivedData = '';
    let username = '';

    // Handle data received from the client
    socket.on('data', async data => {
        try {
            const dataStr = data.toString();

            // If username not received yet, parse it from the data
            if (!username && dataStr.startsWith("Username: ")) {
                username = dataStr.substring(10).trim();
                console.log('Received username:', username);
            }

            // Append received data
            receivedData += dataStr;

            // Check if the received data contains complete segments
            if (receivedData.includes('\r\n')) {
                // Split the received data into segments
                const segments = receivedData.split('\r\n');

                // Extract required fields from the HL7 message
                if (segments.length >= 4) {
                    // Extract doctor name from PID segment
                    const pidFields = segments[1].split('|');
                    const doctorName = pidFields[4];

                    // Extract date from PID segment
                    const date = pidFields[7];

                    // Extract appointment type from PV1 segment
                    const pv1Fields = segments[2].split('|');
                    const appointmentType = pv1Fields[2];

                    // Extract time from OBX segment
                    const obxFields = segments[3].split('|');
                    const time = obxFields[5];

                    console.log("DoctorName:", doctorName);
                    console.log("Date:", date);
                    console.log("Appointment Type:", appointmentType);
                    console.log("Time:", time);

                    // Reset received data for the next message
                    receivedData = '';
                }
            }

            console.log("New appointment is booked successfully");
            socket.write(JSON.stringify("New appointment is booked successfully" ));


        } catch (error) {
            console.error("Error handling data:", error);
            socket.write(JSON.stringify("An error occurred while processing the data." ));
        }
    });

    // Handle client disconnection
    socket.on('end', () => {
        console.log('Client disconnected');
    });

    // Handle errors
    socket.on('error', err => {
        console.error('Socket error:', err);
    });
});

// Start TCP server
const TCP_PORT = 8000;
const TCP_HOST = '0.0.0.0'; // Listen on all available network interfaces
tcpServer.listen(TCP_PORT, TCP_HOST, () => {
    console.log(`TCP server running on ${TCP_HOST}:${TCP_PORT}`);
});
