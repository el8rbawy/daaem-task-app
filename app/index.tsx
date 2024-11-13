import { GLOBLEL_STYLE } from '@/components/global.style';
import React from 'react';
import { View, StyleSheet, Text, TouchableHighlight } from 'react-native';
import { GestureHandlerRootView, TextInput } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Cellular from 'expo-cellular';
import phoneCodes from '@/assets/data/phoneCodes.json';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { OtpInput } from "react-native-otp-entry";
import { msToMinutesAndSeconds } from '@/components/methods';
import { useRouter } from 'expo-router';

let intervalId: any = 0;

export default function VerificationScreen() {
   const router = useRouter();
   const [code, setCode] = React.useState('');
   const [phone, setPhone] = React.useState('');
   const [verify, setVerify] = React.useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
   const [timer, setTimer] = React.useState(0);
   const [isLoading, setIsLoaing] = React.useState(false);
   const [errMessage, setErrMessage] = React.useState('');

   // Get country code automatically
   React.useEffect(() => {
      (async function () {
         const ISOcountryCode = await Cellular.getIsoCountryCodeAsync();
         setCode(phoneCodes.find(country => country.code.toLowerCase() === ISOcountryCode?.toLowerCase() )?.dial_code || '');
         // router.replace('/home'); // remove
      })();
   }, []);

   // ---
   React.useEffect(() => {
      if (timer && !intervalId) {
         intervalId = setInterval(() => {     
            setTimer(timer => {
               const value = timer - 1000;
               if (value <= 0) {
                  clearInterval(intervalId);
                  setVerify(null);
                  setErrMessage('');
                  intervalId = 0;
               }
               return value;
            });
         }, 1000);
      } 
   }, [timer]);

   // ---
   const handleSubmit = async (type: 'send' | 'otp', value?: any) => {
      if (type === 'send') {
         if (!code || !/^\+\d+/.test(code)) {
            return setErrMessage('Please enter a valid code');
   
         } else if (!phone || !/^[0-9]+$/.test(phone)) {
            return setErrMessage('Please enter a valid phone number');
         }
         setErrMessage('');
         setIsLoaing(true);
         const confirmation = await auth().signInWithPhoneNumber(code+phone);
         setVerify(confirmation);
         setTimer(30000); // 30s
         setIsLoaing(false);

      } else if (type === 'otp') {
         try {
            if (verify) await verify.confirm(value);
            clearInterval(intervalId);
            intervalId = 0;
            router.replace('/home');
            
         } catch {
            setErrMessage('The code is invalid!');
         }
      }
   } 

   return (
      <GestureHandlerRootView>
         <SafeAreaView style={{ flex: 1 }}>
            <View style={[ GLOBLEL_STYLE.container, { justifyContent: 'center' }]}>
               { !verify ? <>
                  <View style={{ flexDirection: 'row' }}>
                     <TextInput 
                        keyboardType="phone-pad" 
                        value={ code } 
                        placeholder="Code" 
                        style={[ styles.input, { marginRight: 7.5, width: 60 }]} 
                        onChangeText={ text => setCode(!text || text.startsWith('+') ? text : '+'+text) }
                        maxLength={ 5 }
                     />
                     <TextInput 
                        keyboardType="phone-pad" 
                        value={ phone } placeholder="Enter Mobile" 
                        style={[ styles.input, { flex: 1 }]} 
                        onChangeText={ text => setPhone(text) } 
                        maxLength={ 30 }
                     />
                  </View>
                  <TouchableHighlight 
                     disabled={ isLoading } 
                     style={[ styles.button, isLoading ? { opacity: 0.5 } : {}]} 
                     activeOpacity={ 0.8 } 
                     underlayColor="#1689b7" 
                     onPress={ _=> handleSubmit('send') }
                  >
                     <Text style={ styles.btnText }>Submit</Text>
                  </TouchableHighlight>
               </> : <>
                  <OtpInput 
                     numberOfDigits={ 6 } 
                     onFilled={ text => handleSubmit('otp', text)} 
                     theme={{ pinCodeContainerStyle: styles.otp }}
                  />
                  <Text style={ styles.timer }>{ msToMinutesAndSeconds(timer) }</Text>
               </>}
               <Text style={ styles.error }>{ errMessage }</Text>
            </View>
         </SafeAreaView>
      </GestureHandlerRootView>
   );
}
// ---
const styles = StyleSheet.create({
   input: {
      height: 40,
      padding: 10,
      backgroundColor: '#fff',
      borderRadius: 5,
      textAlign: 'center',
      fontSize: 17
   },
   button: {
      backgroundColor: '#0F9ED5',
      width: '100%',
      marginTop: 10,
      borderRadius: 5,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center'
   },
   btnText: {
      color: '#fff',
      fontSize: 17
   },
   otp: {
      backgroundColor: '#fff', 
      borderRadius: 5
   },
   timer: {
      marginTop: 30,
      fontSize: 20,
      color: '#fff'
   },
   error: {
      color: '#ffacac',
      marginTop: 15,
      fontSize: 17
   }
});