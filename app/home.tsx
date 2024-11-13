import React from "react";
import { GLOBLEL_STYLE } from "@/components/global.style";
import { FlatList, GestureHandlerRootView, TextInput } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity, StyleSheet, TouchableHighlight, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker'
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import { setupDatabase, getAllUsers, insertUser, deleteUser, updateUser, deleteAllUsers } from "@/services/localDB";
import * as FileSystem from 'expo-file-system';
import { firebase } from '@react-native-firebase/database';

interface itemType { id: number, name: string, numberId: string, pictureUri: string };

export default function HomeScreen() {
   const [items, setItems] = React.useState<itemType[]>([]);
   const [pictureUri, setPictureUri] = React.useState('');
   const [isTogglePictureOpt, setIsTogglePictureOpt] = React.useState(false);
   const [name, setName] = React.useState('');
   const [numberId, setNumberId] = React.useState('');
   const [updateId, setUpdateId] = React.useState(0);
   const [isLoading, setIsLoaing] = React.useState(false);

   // ---
   React.useEffect(() => {
      setupDatabase();
      (async function() {
         const users = await getAllUsers() as itemType[];
         setItems(users);
      })();
   }, []);

   // ---
   const handlePicture = async (type: 'take' | 'gallery') => {
      let uri: any = '';
      setIsTogglePictureOpt(false);

      if (type === 'take') {
         const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
         if (permissionResult.granted === false) return alert("You've refused to allow this app to access your camera!");

         const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, quality: 0
         });
         if (!result.canceled) uri = result.assets[0].uri;

      } else if (type === 'gallery') {
         const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
         if (permissionResult.granted === false) return alert("You've refused to allow this app to access your gallery!");

         const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, quality: 0
         });
         if (!result.canceled) uri = result.assets[0].uri;
      }
      if (uri) {
         const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
         setPictureUri(`data:image/jpeg;base64,${base64}`);
      }
   }
   // ---
   const handleAction = async (type: 'add' | 'update' | 'delete' | 'uploadAll', id?: number) => {
      if (type === 'add') {
         if (!name || !/^[\p{L}\s]+$/gu.test(name) || name.length < 3) return alert('No valid name entered');
         else if (!numberId || !/^\d+$/.test(numberId) || numberId.length < 5) return alert('Invalid ID number');

         const itemId = await insertUser(name, numberId, pictureUri);
         setItems(items => [{ id: itemId, name, numberId, pictureUri }, ...items]);
         resetAllInputs();

      } else if (type === 'update') {
         const find = items.find(item => item.id === id);
         if (!find) return;
         setUpdateId(id as number);
         setName(find.name);
         setNumberId(find.numberId);

      } else if (type === 'delete') {
         await deleteUser(id as number);
         setItems(items => items.filter(item => item.id !== id));

      } else if (type === 'uploadAll') {
         if (!items.length) return alert('There is no data to upload');
         setIsLoaing(true);
         const reference = firebase.app().database('https://daaem-task-default-rtdb.europe-west1.firebasedatabase.app/').ref();
         for (const item of items) /* await */ reference.push(item);
         deleteAllUsers();
         setItems([]);
         resetAllInputs();
         setIsLoaing(false);
      }
   }
   // ---
   const handleUpdate = async () => {
      await updateUser(updateId, name, numberId, pictureUri);
      setItems(items => items.map(item => {
         if (item.id === updateId) return ({ ...item, name, numberId, pictureUri });
         else return item;
      }));
      resetAllInputs();
   }
   // ---
   const resetAllInputs = () => {
      setPictureUri(''); setNumberId(''); setName(''); setUpdateId(0);
   }

   return (
      <GestureHandlerRootView>
         <SafeAreaView style={{ flex: 1 }}>
            <View style={ GLOBLEL_STYLE.container }>
               <View style={{ width: '100%', alignItems: 'flex-end' }}>
                  <TouchableHighlight 
                     activeOpacity={ 0.65 } 
                     underlayColor="#f2f2f2" 
                     onPress={ _=> handleAction('uploadAll') }
                     disabled={ isLoading } 
                     style={[ styles.button, isLoading ? { opacity: 0.5 } : {}]} 
                  >
                     <Text style={{ fontSize: 16 }}>Upload</Text>
                  </TouchableHighlight>
               </View>
               <View style={{ position: 'relative', zIndex: 99 }}>
                  <TouchableOpacity activeOpacity={ 0.85 } style={ !pictureUri ? styles.photo : {}} onPress={ _=> setIsTogglePictureOpt(toggle => !toggle) }>{
                     pictureUri ? <Image source={{ uri: pictureUri }} style={{ width: 120, height: 120, borderRadius: 60, marginTop: 30, marginBottom: 20 }} /> :
                     <Entypo name="camera" size={ 35 } color="black" style={{ opacity: 0.35 }} />
                  }</TouchableOpacity>
                  { isTogglePictureOpt ? <View style={ styles.camera }>
                     <TouchableOpacity activeOpacity={ 0.65 } style={ styles.cameraItem } onPress={ _=> handlePicture('take') }>
                        <Entypo name="camera" size={ 25 } color="black" /> 
                        <Text style={{ marginLeft: 7.5, fontSize: 16 }}>Take a picture</Text>
                     </TouchableOpacity>
                     <TouchableOpacity activeOpacity={ 0.65 } style={ styles.cameraItem } onPress={ _=> handlePicture('gallery') }>
                        <AntDesign name="appstore1" size={ 25 } color="black" /> 
                        <Text style={{ marginLeft: 7.5, fontSize: 16 }}>Select from gallery</Text>
                     </TouchableOpacity>
                  </View> : null }
               </View>
               <TextInput 
                  value={ name }
                  placeholder="Full Name" 
                  style={ styles.input } 
                  maxLength={ 25 }
                  onChangeText={ text => setName(text) } 
               />
               <View style={{ flexDirection: 'row', marginTop: 10, marginBottom: 15 }}>
                  <TextInput 
                     keyboardType="numeric"
                     value={ numberId }
                     placeholder="ID Number" 
                     style={[ styles.input, { flex: 1, marginTop: 0, paddingRight: 0 } ]} 
                     maxLength={ 25 }
                     onChangeText={ text => setNumberId(text) } 
                  />
                  <TouchableHighlight 
                     activeOpacity={ 0.65 } 
                     underlayColor="#f2f2f2" 
                     onPress={ _=> {
                        if (updateId) handleUpdate();
                        else handleAction('add');
                     }}
                     style={[ styles.button, { width: 50, height: 40, marginLeft: 7.5 }]}
                  >
                     <AntDesign name={ updateId ? 'check' : 'plus' } size={ 26 } color="black" />
                  </TouchableHighlight>
               </View>
               <FlatList
                  data={ items }
                  showsVerticalScrollIndicator={ false }
                  renderItem={({ item }) => (
                     <View style={ styles.item }>
                        <View style={ styles.info }>
                           <View style={[ styles.photo, { width: 70, height: 70, marginRight: 15 }]}>
                              { item.pictureUri ? <Image source={{ uri: item.pictureUri }} style={{ width: '100%', height: '100%', borderRadius: 35 }} /> : null }
                           </View>
                           <View style={{ flex: 1 }}>
                              <Text style={ styles.text }>{ item.name }</Text>
                              <Text style={ styles.text }>{ item.numberId }</Text>
                           </View>
                        </View>
                        <View style={ styles.action }>
                           <TouchableOpacity 
                              activeOpacity={ 0.65 } 
                              onPress={ _=> {
                                 if (item.id === updateId) resetAllInputs();
                                 else handleAction('update', item.id); 
                              }}
                           >
                              <Text style={[ styles.text, { paddingVertical: 5, color: item.id === updateId ? '#000' : '#fff' }]}>
                                 { item.id === updateId ? 'Cancel' : 'Update' }
                              </Text>
                           </TouchableOpacity>
                           <Text style={[ styles.text, { opacity: 0.5 }]}>|</Text>
                           <TouchableOpacity activeOpacity={ 0.65 } onPress={ _=> handleAction('delete', item.id) }>
                              <Text style={[ styles.text, { paddingVertical: 5, color: '#ffc4c4' } ]}>Delete</Text>
                           </TouchableOpacity>
                        </View>
                     </View>
                  )}
                  keyExtractor={(item) => item.id.toString() }
                  ListEmptyComponent={ <Text style={ styles.empty }>Your list is empty.</Text> }
               />
            </View>
         </SafeAreaView>
      </GestureHandlerRootView>
   );
}
// ---
const styles = StyleSheet.create({
   button: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 100,
      height: 35,
      backgroundColor: '#fff',
      borderRadius: 5,
      fontSize: 20
   },
   photo: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff', 
      width: 120,
      height: 120,
      borderRadius: 60,
      marginTop: 30,
      marginBottom: 20,
   },
   camera: {
      position: 'absolute',
      top: '95%',
      left: 0,
      backgroundColor: '#fff',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
      borderRadius: 5,
   },
   cameraItem: {
      flexDirection: 'row',
      alignItems: 'center',
      width: 200,
      height: 40,
      paddingHorizontal: 15
   },
   input: {
      width: '100%',
      height: 40,
      padding: 10,
      backgroundColor: '#fff',
      borderRadius: 5,
      textAlign: 'center',
      fontSize: 17,
      marginTop: 10,
      paddingRight: 55,
   },
   item: { 
      width: '100%', 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.2)'
   },
   text: {
      color: '#fff',
      fontSize: 17
   },
   info: { 
      flexDirection: 'row', 
      alignItems: 'center',
      width: '60%', 
      flex: 1 
   },
   action: {
      flexDirection: 'row', 
      alignItems: 'center', 
      width: 125, 
      justifyContent: 'space-between',
      marginLeft: 10
   },
   empty: {
      opacity: 0.65,
      color: '#fff',
      fontSize: 18,
      marginTop: 30
   }
});