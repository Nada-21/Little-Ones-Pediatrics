
const net = require('net');

// Function to construct HL7 message
function constructHL7Message(doctorName, appointmentType, date, time) {
    // Example of constructing an HL7 message format (modify as per your HL7 standard)
    const hl7Message = `MSH|^~\\&|SenderApp|SenderFac|ReceiverApp|ReceiverFac|${new Date().toISOString()}||ADT^A01|MsgID001|P|2.7\r\n`;
    const pidSegment = `PID|1|||${doctorName}|||${date}||\r\n`;
    const pv1Segment = `PV1||${appointmentType}||||||||||||||||\r\n`;
    const obxSegment = `OBX|1|CE|Appointment Time|1|${time}||||||F\r\n`;

    return hl7Message + pidSegment + pv1Segment + obxSegment;
}

// Construct HL7 message
const doctorName = "Yasmin";
const appointmentType = "new";
const date = "2024-04-28"; // Example date
const time = "10:00 AM";   // Example time
const hl7Message = constructHL7Message(doctorName, appointmentType, date, time);

// Connect to the server and send HL7 message
const client = new net.Socket();
client.connect(5000, '172.28.128.61', () => {
    console.log('Connected');
    client.write(hl7Message); // Send HL7 message
});

client.on('data', (data) => {
    console.log('Received:', data.toString('utf-8'));
    // Close the connection after receiving the response
    client.end();
});

client.on('close', () => {
    console.log('Connection closed');
});


