import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet, TextInput, Image,KeyboardAvoidingView ,Alert,ToastAndroid} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import firebase from 'firebase';
import db from '../config';


export default class TransactionScreen extends React.Component {
  constructor() {
    super();
    this.state = {
      hasCameraPermissions: null,
      scanned: false,
      scannedBookId: '',
      scannedStudentId: '',
      buttonState: 'normal',
      transactionMessage: '',
    }
  }

  getCameraPermissions = async (id) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      hasCameraPermissions: status === "granted",
      buttonState: id,
      scanned: false
    });
  }

  handleBarCodeScanned = async ({ type, data }) => {
    const { buttonState } = this.state;
    if (buttonState === "BookId") {
      this.setState({
        scanned: true,
        scannedBookId: data,
        buttonState: 'normal'
      });
    }

    else if (buttonState === "StudentId") {
      this.setState({
        scanned: true,
        scannedStudentId: data,
        buttonState: 'normal'
      });
    }

  }

  initiateBookIssue = async () => {
    db.collection("transactions").add({
      'studentId': this.state.scannedStudentId,
      'bookId': this.state.scannedBookId,
      'date': firebase.firestore.Timestamp.now().toDate(),
      'transactionType': "Issue"
    });
    db.collection("books").doc(this.state.scannedBookId).update({
      'bookAvailability': false,
    });
    db.collection("students").doc(this.state.scannedStudentId).update({
      'numberOfBooksIssued': firebase.firestore.FieldValue.increment(1),
    });
    this.setState({
      scannedStudentId: '',
      scannedBookId: '',
    });
  }

  initiateBookReturn = async () => {
    db.collection("transactions").add({
      'studentId': this.state.scannedStudentId,
      'bookId': this.state.scannedBookId,
      'date': firebase.firestore.Timestamp.now().toDate(),
      'transactionType': "Return"
    });
    db.collection("books").doc(this.state.scannedBookId).update({
      'bookAvailability': true,
    });
    db.collection("students").doc(this.state.scannedStudentId).update({
      'numberOfBooksIssued': firebase.firestore.FieldValue.increment(-1),
    });
    this.setState({
      scannedStudentId: '',
      scannedBookId: '',
    });
  }

  checkBookEligibility = async () => {
    console.log('hello');
    const bookRef = await db.collection("books").where("bookId","==",this.state.scannedBookId).get();
    var transactionType = '';
    if(bookRef.docs.length == 0){
      transactionType = false;
    }
    else{
      bookRef.docs.map((doc) => {
        var book = doc.data();
        if(book.bookAvailability){
          transactionType =  "Issue";
        }
        else{
          transactionType = "Return";
        }
      })
    }

    return transactionType;
  }

  checkStudentEligibilityForBookIssue = async()=> {
    var studentRef = await db.collection("students").where("studentId","==",this.state.scannedStudentId).get();
    var isStudentEligible = '';

    if(studentRef.docs.length == 0){
      isStudentEligible = false;
      this.setState({
        scannedStudentId:'',
        scannedBookId:'',
      })
      Alert.alert("The Student Id does not Exist in Database");
    }

    else{
      studentRef.docs.map((doc) => {
        var student = doc.data();
        
        if(student.numberOfBooksIssued < 2){
          isStudentEligible = true;
        }
        else{
          isStudentEligible = false;
          Alert.alert("The Student has already issued 2 books");
          this.setState({
            scannedBookId:'',
            scannedStudentId:'',
          })
        }
      })
    }

    return isStudentEligible;
  }

  checkStudentEligibilityForBookReturn = async() => {
    const transactionRef = await db.collection("transactions")
    .where("bookId","==",this.state.scannedBookId)
    .limit(1).get();

    var isStudentEligible = '';

    transactionRef.docs.map((doc) => {
      var lastBookTransaction = doc.data();

      if(lastBookTransaction.studentId === this.state.scannedStudentId){
        isStudentEligible =  true;
      }
      else{
        isStudentEligible = false;
        Alert.alert("THE BOOK WASN'T ISSUED BY THIS STUDENT")
        this.setState({
          scannedStudentId:'',
          scannedBookId:'',
        })
      }
    })

    return isStudentEligible;
  }

  handleTransaction = async () => {

    console.log('asdhfkhdfiwefhe');

    var transactionType = await this.checkBookEligibility();
    if(!transactionType){
      console.log('dfkdfkldsahgksdgfdasflkdaslfgkjd');
      Alert.alert("The Book Does Not Exist In The Library Database");
      this.setState({
        scannedBookId:'',
        scannedStudentId:'',
      })
    }

    else if(transactionType === "Issue"){
      console.log('adhjfudkashfgdjkasfhjkasdfhdjask')
      var isStudentEligible = await this.checkStudentEligibilityForBookIssue();
      if (isStudentEligible){
        this.initiateBookIssue();
        Alert.alert("BOOK ISSUED TO THE STUDENT");
      }

    }

    else{
      console.log('sdfjasdjklfhdjksfghasdhjkgdfasjkghadsjkfghdasjkg');
      var isStudentEligible = await this.checkStudentEligibilityForBookReturn();
      if(isStudentEligible){
        this.initiateBookReturn();
        Alert.alert("BOOK RETURNED TO THE LIBRARY");
      }
    }
  }

  render() {
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;

    if (buttonState != "normal" && hasCameraPermissions) {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }

    else if (buttonState === "normal") {
      return (
        <KeyboardAvoidingView style={styles.container}
        behavior = 'padding'
        enabled>
          <View>
            <Image
              source={require('../assets/booklogo.jpg')}
              style={{ width: 200, height: 200 }} />
            <Text style={{ textAlign: 'center', fontSize: 30, }}>
              WILY
              </Text>
          </View>
          <View style={styles.inputView}>
            <TextInput
              onChangeText = {word => {
                this.setState({
                  scannedBookId:word
                })
              }}
              style={styles.inputBox}
              placeholder='BOOK ID'
              value={this.state.scannedBookId}>
            </TextInput>
            <TouchableOpacity style={styles.scanButton}
              onPress={() => {
                this.getCameraPermissions('BookId')
              }}>
              <Text style={styles.buttonText}>SCAN</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputView}>
            <TextInput
              onChangeText = {word => {
                this.setState({
                  scannedStudentId:word
                })
              }}
              style={styles.inputBox}
              placeholder='STUDENT ID'
              value={this.state.scannedStudentId}>
            </TextInput>
            <TouchableOpacity style={styles.scanButton}
              onPress={() => {
                this.getCameraPermissions('StudentId')
              }}>
              <Text style={styles.buttonText}>SCAN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                var transactionMessage = await this.handleTransaction();
                
              }}
              style={{ backgroundColor: 'red', width: 100, height: 50 }}>
              <Text style={{ padding: 10, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: 'white' }}>SUBMIT</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  displayText: {
    fontSize: 15,
    textDecorationLine: 'underline'
  },
  scanButton: {
    backgroundColor: '#2196F3',
    width: 50,
    borderWidth: 1.5,
    borderLeftWidth: 0,

  },
  buttonText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
  },

  inputView: {
    flexDirection: 'row',
    margin: 20,
  },
  inputBox: {
    width: 200,
    height: 40,
    borderWidth: 1.5,
    borderRightWidth: 0,
    fontSize: 20,
  },

});