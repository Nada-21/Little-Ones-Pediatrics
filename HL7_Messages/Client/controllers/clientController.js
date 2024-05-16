const net = require('net');
const connection = require('../DataBase/connection'); // Import the connection module 


// Function to construct HL7 message
function constructHL7Message(doctorName, appointmentType, date, time, patientId, patientUsername) {
    // Example of constructing an HL7 message format (modify as per your HL7 standard)
    const hl7Message = `MSH|^~\\&|Patient Client|Little Ones Pediatrics|System Server|Little Ones Pediatrics|${new Date().toISOString()}||ADT^A01|MsgID001|P|2.7\r\n`;
    const pidSegment = `PID|1|${patientId}|||${patientUsername}||||||\r\n`;
    const pv1Segment = `PV1||${appointmentType}||||||||${doctorName}||||||\r\n`;
    const obxSegment = `OBX|1|CE|Appointment Time|Date|1|${time}|${date}|||||F\r\n`;

    return hl7Message + pidSegment + pv1Segment + obxSegment;
}

async function sendAppointment(req, res) {
    try {
        const { Username, DoctorName, Type, Date, Slot } = req.body;
        
        const [patientResult] = await connection.promise().query(
            'SELECT registration.PatientID FROM registration  WHERE Username = ?', [Username]
        );


        const PatientID = patientResult[0].PatientID;

        console.log("PatientID: ", PatientID);

        // Construct HL7 message
        const hl7Message = constructHL7Message(DoctorName, Type, Date, Slot, PatientID, Username);

        // Connect to the server and send HL7 message
        const client = new net.Socket();
        client.connect(8000, '192.168.1.6', async () => {
            console.log('Connected');

            // Write the HL7 message to the server
            client.write(hl7Message); // Send HL7 message
        });

        // Wait for data from the server
        const receivedData = await new Promise((resolve, reject) => {
            client.on('data', (data) => {
                console.log('Received:', data.toString('utf-8'));
                res.status(200).send(data.toString('utf-8'));
                resolve(data.toString('utf-8'));
            });

            client.on('error', (err) => {
                reject(err);
            });
        });

        // Close the connection
        client.end();
    } catch (error) {
        console.error('Error:', error);
        // Send error response to the client
        res.status(500).send('Internal Server Error');
    }
}
//=================================================================================================================
module.exports = {
    sendAppointment,
};