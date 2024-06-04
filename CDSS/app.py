from email import message
from flask import Flask, redirect, url_for, request,render_template,flash,session
import numpy as np
import os
import time
from werkzeug.utils import secure_filename
import mysql.connector
from convert import*
from model import*

mydb = mysql.connector.connect(
  host="localhost",
  user="root",
  passwd="",
  database="pediatric_clinic"
)

app = Flask(__name__)

mycursor = mydb.cursor()
app = Flask(__name__,template_folder="templates")

app.secret_key = 'SECRET KEY FOR PROJECT'
app.config['UPLOAD_FOLDER'] = 'uploads/'

# Ensure the upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Define the global variable
LoginPatientID = None
SearchPatientID = None
patientimage = None
ModelResult = None


@app.route('/')
def hello_name():
   return render_template('index.html')

@app.route('/about')
def about():
   return render_template('about.html')

@app.route('/contact')
def contact():
   return render_template('contact.html')

@app.route('/treatment')
def treatment():
   return render_template('treatment.html')

@app.route('/doctors')
def doctors():
   return render_template('doctor.html')

@app.route('/get_doctors', methods=['GET'])
def get_doctors():
    mycursor.execute("SELECT DoctorName, Experience, Category, Gender FROM Doctors")
    doctors = mycursor.fetchall()
    doctors_list = []
    for doctor in doctors:
        doctors_list.append({
            'DoctorName': doctor[0],
            'Experience': doctor[1],
            'Category': doctor[2],
            'Gender': doctor[3]
        })
    return (doctors_list)



@app.route('/patientlogin', methods = ['POST', 'GET'])
def login():
   global LoginPatientID
   msg=""
   if request.method == 'POST': ##check if there is post data
      username = request.form['Username']
      Password = request.form['Password']
      mycursor.execute("SELECT * FROM registration WHERE Username = (%s) AND Password = (%s)", (username, Password))
      checkpatient = mycursor.fetchone()
      if checkpatient:
         session['PatientID'] = checkpatient[0]  # Assuming PatientID is the first column
         LoginPatientID = session['PatientID']

         msg= 'Login Successfully'
         return render_template('View_EHR.html',checkpatient=checkpatient)
         
      else:
            msg= 'Wrong Login'
            return render_template('login.html', msg= msg)
   else:
      return render_template('login.html')


@app.route('/Editinfo')
def Editinfo():
   return render_template('Editinfo.html')

@app.route('/boock')
def boock():
   return render_template('boock.html')

@app.route('/View_EHR')
def View_EHR():
   return render_template('View_EHR.html')

@app.route('/DoctorSchedule')
def DoctorSchedule():
   return render_template('DoctorSchedule.html')

@app.route('/Model')
def Model():
   return render_template('Model.html')

@app.route('/Registration', methods=['GET', 'POST'])
def Registration():
    return render_template('Registration.html')

@app.route('/EMR')
def EMR():
   return render_template('EMR.html')

@app.route('/patientEMR')
def patientEMR():
   return render_template('patientEMR.html')

@app.route('/uploadfile', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return ({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return ({"error": "No selected file"}), 400

    if file:
        filename = secure_filename(f"{int(time.time())}_{file.filename}")
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        PatientID = LoginPatientID

        print(f"PatientID: {PatientID}")

        if not PatientID:
            return ({"error": "No PatientID provided"}), 400

        update_query = """
        UPDATE registration
        SET pdfFile = %s, filePath = %s
        WHERE PatientID = %s"""

        try:
            mycursor.execute(update_query, (filename, file_path, PatientID))
            mydb.commit()
            return ({"message": f"Patient with ID {PatientID} uploaded file successfully."}), 200
        except mysql.connector.Error as err:
            print(f"Error: {err}")
            return ({"error": "Internal Server Error"}), 500


@app.route('/search', methods=['GET'])
def search_patient():
    patient_id = request.args.get('patientID')

    print(f"PatientId: {patient_id}")

    # New SQL query to fetch patient registration and EMR data
    sql = "SELECT FirstName, LastName, Age FROM registration WHERE PatientID = %s"

    try:
        with connection.cursor() as cursor:
            cursor.execute(sql, (patient_id,))
            checkdata = cursor.fetchone()

            if checkdata:
                return ({"FirstName": checkdata[0], "LastName": checkdata[1], "Age": checkdata[2]}), 200
            else:
                return ({"error": "Patient data not found. Please create a new EMR."}), 404

    except Exception as e:
        return ({"error": "An error occurred while fetching patient data. Please try again."}), 500


@app.route('/getfile', methods=['GET'])
def get_file():
    global patientimage
    global ModelResult

    patientID = request.args.get('patientID')

    sql_query = "SELECT filePath FROM registration WHERE PatientID = %s"

    try:
        mycursor.execute(sql_query, (patientID,))
        result = mycursor.fetchone()
        if not result:
            return ({"message": f"No file found for patient with ID {patientID}."}), 404
        file_path = result[0]
        print (f"File Path: {file_path}")
        image = save_jpg_image(file_path)
        patientimage = image
        print (f"Patient Image: {patientimage}")

        modelresult = ModelClassification(file_path)
        ModelResult=modelresult

        print (f"Model Result: {modelresult}")

        return ({"fileimage": image}), 200

    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return ({"error": "Internal Server Error"}), 500


@app.route('/savepatientid', methods=['GET'])
def save_patient_id():
    global SearchPatientID
    patientID = request.args.get('patientID')
    SearchPatientID = patientID
    return ({"message": "Patient ID saved successfully"})
 

@app.route('/getpatientid', methods=['GET'])
def get_patient_id():
    return {"PatientID": SearchPatientID}, 200

@app.route('/getpatientImage', methods=['GET'])
def get_patient_Image():
    return {"PatientImage": patientimage}, 200

@app.route('/modelresult', methods=['GET'])
def modelresult():
    return {"ModelResult": ModelResult}, 200



@app.route('/doctorlogin', methods = ['POST', 'GET'])
def Dlogin():
   msg=""
   if request.method == 'POST': ##check if there is post data
      username = request.form['Username']
      Password = request.form['Password']
      mycursor.execute("SELECT * FROM Doctors WHERE Username = (%s) AND Password = (%s)", (username, Password))
      checkdoctor = mycursor.fetchone()  
      if checkdoctor:
         msg= 'Login Successfully'
         return render_template('EMR.html',checkdoctor=checkdoctor)
         
      else:
            msg= 'Wrong Login'
            return render_template('DLogin.html', msg= msg)
   else:
      return render_template('DLogin.html')


if __name__ == '__main__':
   app.run(debug=True)
   
