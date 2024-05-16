const connection = require('../DataBase/connection'); // Import the connection module 
const net = require('net');
//========================================================================================================
let receivedData = '';

async function serverdata(req, res) {

    const tcpServer = net.createServer(socket => {
        console.log('Client connected');

        socket.on('data', async data => {
            try {
                const dataStr = data.toString();

                receivedData += dataStr;

                if (receivedData.includes('\r\n')) {
                    try {
                        const segments = receivedData.split('\r\n');
                        const pidFields = segments[1].split('|');
                        const PatientId = pidFields[2];
                        const PatientUsername = pidFields[5];
                        const pv1Fields = segments[2].split('|');
                        const appointmentType = pv1Fields[2];
                        const doctorName = pv1Fields[10];
                        const obxFields = segments[3].split('|');
                        const time = obxFields[6];
                        const date = obxFields[7];

                        console.log("PatientID: ", PatientId);
                        console.log("PatientUsername: ", PatientUsername);
                        console.log("Date: ", date);
                        console.log("AppointmentType: ", appointmentType);
                        console.log("DoctorName: ", doctorName);
                        console.log("Time: ", time);

                        const appointmentExists = await checkAppointmentExists(doctorName, date, time);
                        if (appointmentExists) {
                            const errmsg= `MSH|^~\&|Patient Client|Little Ones Pediatrics|System Server|Little Ones Pediatrics|202404291030||SIU^S14|123456|P|2.5\r\n
                            PID|1|${PatientId}|||${PatientUsername}||||||\r\n
                            PV1||${appointmentType}||||||||${doctorName}||||||\r\n
                            OBX|1|CE|Appointment Time|Date|1|${time}|${date}|||||F\r\n
                            NTE|1||This appointment is not available as it is booked before.`
                            socket.write(JSON.stringify( `${errmsg}`));

                            //socket.write(JSON.stringify({ error: "This appointment is not available as it is booked before." }));
                            console.log('Sent error message to client:', "This appointment is not available as it is booked before.");
                        }

                        const insertedAppointmentID = await insertAppointment(PatientUsername, PatientId, doctorName, appointmentType, date, time);
                        console.log("New appointment is booked successfully");

                        const conmsg= `MSH|^~\&|Patient Client|Little Ones Pediatrics|System Server|Little Ones Pediatrics|202404291030||SIU^S14|123456|P|2.5\r\n
                        PID|1|${PatientId}|||${PatientUsername}||||||\r\n
                        PV1||${appointmentType}||||||||${doctorName}||||||\r\n
                        OBX|1|CE|Appointment Time|Date|1|${time}|${date}|||||F\r\n
                            NTE|1||New appointment is booked successfully.`
                        socket.write(JSON.stringify(`${conmsg}`, insertedAppointmentID));

                        //socket.write(JSON.stringify({ message: "New appointment is booked successfully", insertedAppointmentID }));

                        // Send receivedData in the response after processing
                        // res.status(200).json(receivedData);
                        console.log("HL7 Message: ", receivedData)

                    } catch (error) {
                        console.error("Error processing appointment:", error);
                        errmsg2=`MSH|^~\&|Patient Client|Little Ones Pediatrics|System Server|Little Ones Pediatrics|202404291030||SIU^S14|123456|P|2.5\r\n
                        PID|1|${PatientId}|||${PatientUsername}||||||\r\n
                        PV1||${appointmentType}||||||||${doctorName}||||||\r\n
                        OBX|1|CE|Appointment Time|Date|1|${time}|${date}|||||F\r\n
                        NTE|1||An error occurred while booking the appointment.`
                        socket.write(JSON.stringify(`${errmsg2}`));

                        //socket.write(JSON.stringify({ error: "An error occurred while booking the appointment." }));
                    } finally {
                        // receivedData = '';
                    }
                }
            } catch (error) {
                console.error("Error handling data:", error);

                errmsg3=`MSH|^~\&|Patient Client|Little Ones Pediatrics|System Server|Little Ones Pediatrics|202404291030||SIU^S14|123456|P|2.5\r\n
                PID|1|${PatientId}|||${PatientUsername}||||||\r\n
                PV1||${appointmentType}||||||||${doctorName}||||||\r\n
                OBX|1|CE|Appointment Time|Date|1|${time}|${date}|||||F\r\n
                NTE|1||An error occurred while processing the data.`
                socket.write(JSON.stringify(`${errmsg3}`));

                //socket.write(JSON.stringify({ error: "An error occurred while processing the data." }));
            }
        });

        socket.on('end', () => {
            console.log('Client disconnected');
        });

        socket.on('error', err => {
            console.error('Socket error:', err);
        });
    });

    const TCP_PORT = 8000;
    const TCP_HOST = '0.0.0.0';
    tcpServer.listen(TCP_PORT, TCP_HOST, () => {
        console.log(`TCP server running on ${TCP_HOST}:${TCP_PORT}`);
    });
    
}
// =======================================================================================================
async function senddata(req, res) {
    res.status(200).json(receivedData);
}

//========================================================================================================

async function checkAppointmentExists(DoctorName, Date, Slot) {
    const sql_query_CheckAppointment = `SELECT COUNT(*) AS count FROM appointment WHERE DoctorName = ? AND Date = ? AND Slot = ?`;
    const [result] = await connection.promise().query(sql_query_CheckAppointment, [DoctorName, Date, Slot]);
    return result[0].count > 0;
}

async function insertAppointment(Username, PatientID, DoctorName,Type, Date, Slot) {
    try {

        const [patientResult] = await connection.promise().query(
            'SELECT registration.PatientID FROM registration  WHERE Username = ?', [Username]
        );

        // Get DoctorID from doctors table by the given DoctorName
        const [doctorResult] = await connection.promise().query(
            'SELECT doctors.DoctorID , doctors.Username FROM doctors WHERE DoctorName = ?', [DoctorName]
        );

        const DoctorID = doctorResult[0].DoctorID;
        const doctorUsername = doctorResult[0].Username;


        // Insert into appointment table
        const sql_query_Appointment = 'INSERT INTO appointment (DoctorName,Type, Date, Slot, DoctorID, PatientID, DoctorUsername) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const [appointmentResult] = await connection.promise().query(sql_query_Appointment, [DoctorName,Type, Date, Slot, DoctorID, PatientID, doctorUsername]);
       
        // Get the auto-incremented AppointmentID from the inserted record
        const insertedAppointmentID = appointmentResult.insertId;
        console.log('Appointment inserted successfully');
        return insertedAppointmentID;

    } catch (error) {
        console.error('Error inserting appointment:', error);
        throw error;
    }
}
//========================================================================================================
module.exports = {
    serverdata,
    senddata,
};
