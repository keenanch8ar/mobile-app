import React, {Component} from 'react';
import { Alert, Platform, StyleSheet, Text, View, Image} from 'react-native';
import MapView from 'react-native-maps';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import ActionButton from 'react-native-action-button';
import { Location, Permissions } from 'expo';
import SnackBar from 'react-native-snackbar-component';
import axios from 'axios';

const mapStyle = [{"featureType":"all","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"all","elementType":"labels","stylers":[{"visibility":"on"},{"saturation":"-100"}]},{"featureType":"all","elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#d7dee5"},{"lightness":40},{"visibility":"on"}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#19222a"},{"lightness":16}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"on"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#19222a"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"landscape","elementType":"geometry.fill","stylers":[{"color":"#3f4c5a"}]},{"featureType":"landscape","elementType":"geometry.stroke","stylers":[{"color":"#3f4c5a"}]},{"featureType":"landscape.natural","elementType":"geometry.fill","stylers":[{"color":"#3f4c5a"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"lightness":21}]},{"featureType":"poi","elementType":"geometry.fill","stylers":[{"color":"#3f4c5a"}]},{"featureType":"poi","elementType":"geometry.stroke","stylers":[{"color":"#257bcb"}]},{"featureType":"road","elementType":"geometry","stylers":[{"visibility":"on"}]},{"featureType":"road","elementType":"geometry.fill","stylers":[{"color":"#d7dee5"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#3f4c5a"},{"lightness":"52"},{"weight":"1"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#d7dee5"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#d7dee5"},{"lightness":18}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#d7dee5"},{"lightness":"14"}]},{"featureType":"road.arterial","elementType":"geometry.stroke","stylers":[{"color":"#d7dee5"}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#d7dee5"},{"lightness":16}]},{"featureType":"road.local","elementType":"geometry.fill","stylers":[{"color":"#d7dee5"}]},{"featureType":"road.local","elementType":"geometry.stroke","stylers":[{"color":"#d7dee5"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#19222a"},{"lightness":19}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#2b3638"},{"visibility":"on"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#2b3638"},{"lightness":17}]},{"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#19222a"}]},{"featureType":"water","elementType":"geometry.stroke","stylers":[{"color":"#24282b"}]},{"featureType":"water","elementType":"labels","stylers":[{"visibility":"on"}]},{"featureType":"water","elementType":"labels.text","stylers":[{"visibility":"on"}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"visibility":"on"}]},{"featureType":"water","elementType":"labels.text.stroke","stylers":[{"visibility":"on"}]},{"featureType":"water","elementType":"labels.icon","stylers":[{"visibility":"on"}]}]

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  actionButtonIcon: {
    fontSize: 23,
    height: 25,
    color: 'white',
  },
});

const isAndroid = (Platform.OS === 'android');
const satMarkerImage = require('../assets/equisat_logo_white.png');
const satMarkerImage_android = require('../assets/equisat_logo_white_android.png');

export default class TrackFragment extends React.Component {

  state = {
    mapLat: 0,
    mapLong: 0,    
    satAlt: 0,
    satLocButtonSize: 60,
    satCoord: {latitude: 0, longitude: 0},
    satCoords: [],
    lockedToSatLoc: true,    

    searchText: "",
    searchLat: 0,
    searchLong: 0,
    showSearchLocMarker: false,
    searchErrorSnackbarVisible: false,
    searchLocCalloutText: "EQUiSat will pass over this location on 7/2/2018 at 8:00pm.",

    userLat: 0,
    userLong: 0,
    userLocErrorSnackbarVisible: false,
    gotUserLoc: false,    
    showUserLoc: false,
    showUserLocMarker: false,
    userLocCalloutText: "EQUiSat will pass over you on 6/30/2018 at 7:00pm."
  }  

  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      var _this = this;
      _this.setState({ locErrorSnackbarVisible: true })
      setTimeout(function(){_this.setState({ locErrorSnackbarVisible: false })}, 5000);
    }
    var location = await Location.getCurrentPositionAsync({});    
    var userLat = location.coords.latitude;
    var userLong = location.coords.longitude;
    this.setState({ userLat });
    this.setState({ userLong });
    this.setState({ gotUserLoc: true });
    this.setState({ showUserLocMarker: true });
  };

  updateSatLocation(_this) {
    this.serverRequest =
      axios
        .get('http://13.58.206.57/api/get_lonlatalt')
        .then(function(result) {
          let satCoord = {latitude: result.data.latitude, longitude: result.data.longitude};        
          _this.setState({ satCoord });
          _this.setState({ satAlt: result.data.altitude });
          let satCoords = [ ..._this.state.satCoords, satCoord];
          _this.setState({ satCoords });                    
          if (_this.state.lockedToSatLoc) {
            let region = {
              latitude: result.data.latitude,
              longitude: result.data.longitude,
              latitudeDelta: 50,
              longitudeDelta: 50,
            }
            _this.map.animateToRegion(region);
          }          
        })
        .catch(function (error) {
          alert(error);
          return undefined; });
  }  

  componentDidMount() {
    this._getLocationAsync(); //get user location
    var _this = this;
    //get sat location
    setInterval(function(){
      _this.updateSatLocation(_this);
    }, 2000);      
  }

  showUserLoc() {
    this.setState({ lockedToSatLoc: false });
    this.setState({ showUserLoc: true });
    let region = {
      latitude: this.state.userLat,
      longitude: this.state.userLong,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    }
    this.map.animateToRegion(region);
    var _this = this;
    setTimeout(function(){ _this.userLocMarker.showCallout(); }, 300);
  }

  onPanDragStart() {
    this.setState({ lockedToSatLoc: false });
  }

  snapToSat() {
    this.setState({ lockedToSatLoc: true })
    let region = {
      latitude: this.state.satCoord.latitude,
      longitude: this.state.satCoord.longitude,
      latitudeDelta: 50,
      longitudeDelta: 50,
    }
    this.map.animateToRegion(region);
  }

  render() {    
    return(
      <View 
        style={styles.container}        
      >        
        <MapView
          onMoveShouldSetResponder={() => {
            this.onPanDragStart()
            return true
          }}        
          ref={map => {this.map = map}}
          style={styles.map}
          initialRegion={{
            latitude: this.state.mapLat,
            longitude: this.state.mapLong,
            latitudeDelta: 50,
            longitudeDelta: 50
          }}
          customMapStyle={mapStyle}
          showsMyLocationButton={true}
          provider="google"
        >
          <MapView.Marker
            ref={ref => { this.userLocMarker = ref; }}
            coordinate={{
              latitude: this.state.userLat,
              longitude: this.state.userLong
            }}
            opacity={this.state.showUserLocMarker ? 1.0 : 0 }
          >
            <MapView.Callout>
              <Text>{this.state.userLocCalloutText}</Text>
            </MapView.Callout>
          </MapView.Marker>

          <MapView.Marker
            ref={ref => { this.searchLocMarker = ref; }}
            coordinate={{
              latitude: this.state.searchLat,
              longitude: this.state.searchLong
            }}
            opacity={this.state.showSearchLocMarker ? 1.0 : 0}
          >
            <MapView.Callout>
              <Text>{this.state.searchLocCalloutText}</Text>
            </MapView.Callout>
          </MapView.Marker>

          <MapView.Marker.Animated
            ref={ref => { this.satMarker = ref; }}
            coordinate={ this.state.satCoord }
            image={isAndroid ? satMarkerImage_android : null}
            opacity={(this.state.satCoord.latitude != 0 || this.state.satCoord.latitude != 0)  ? 1.0 : 0}
          >
            {isAndroid ? null : <Image source={satMarkerImage} style={{width:40, height:40}} resizeMode="contain" />}
          </MapView.Marker.Animated>
          
          <MapView.Polyline            
            coordinates={this.state.satCoords}
            strokeWidth={5}
            strokeColor="#6aa2c8"/>          
        </MapView>        
        <ActionButton 
          buttonColor="#6aa2c8"
          size={this.state.gotUserLoc ? 60 : 0}
          renderIcon={active => active ? (<Icon name="crosshairs-gps" style={styles.actionButtonIcon} /> ) : (<Icon name="crosshairs-gps" style={styles.actionButtonIcon} />)}
          offsetX={15}
          offsetY={90}
          fixNativeFeedbackRadius={true}
          userNativeFeedback={true}          
          onPress={() => { this.showUserLoc() }}
        />
        <ActionButton 
          buttonColor="#6aa2c8"
          size={60}
          renderIcon={active => active ? (<EQUiSatIcon/> ) : (<EQUiSatIcon/>)}
          offsetX={15}
          offsetY={15}
          fixNativeFeedbackRadius={true}
          userNativeFeedback={true}          
          onPress={() => { this.snapToSat() }}
        />
        <SnackBar visible={this.state.userLocErrorSnackbarVisible} textMessage="Can't get location: Permission Denied" actionHandler={()=>{this.setState({userLocErrorSnackbarVisible: false})}} actionText="OK"/>
        <SnackBar visible={this.state.searchErrorSnackbarVisible} textMessage="No results for location" actionHandler={()=>{this.setState({searchErrorSnackbarVisible: false})}} actionText="OK"/>
      </View>
    );
  }
}

class EQUiSatIcon extends React.Component {
  render() {
    return (
      <Image
        source={require('../assets/equisat_logo_white.png')}
        fadeDuration={0}
        style={{width: 30, height: 30}}
      />
    );
  }
}