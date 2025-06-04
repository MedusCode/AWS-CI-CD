import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './styles/style.css';
import CoursesMode from './components/CoursesMode';
import { library } from '@fortawesome/fontawesome-svg-core'
import { faPlus, faMapPin, faGlobe, faMap, faPhone, faEye, faCamera, faXmark, faCircleXmark, faEdit, faSave, faStar, faCheck, faCircleInfo, faArrowPointer, faChartLine } from '@fortawesome/free-solid-svg-icons'
library.add(faPlus)
library.add(faMapPin)
library.add(faGlobe)
library.add(faMap)
library.add(faPhone)
library.add(faEye)
library.add(faCamera)
library.add(faXmark)
library.add(faCircleXmark)
library.add(faEdit)
library.add(faSave)
library.add(faStar)
library.add(faCheck)
library.add(faCircleInfo)
library.add(faArrowPointer)
library.add(faChartLine)


const coursesDiv = ReactDOM.createRoot(document.getElementById('coursesModeTab'));
coursesDiv.render(
  <React.StrictMode>
    <CoursesMode />
  </React.StrictMode>
);

// // If you want to start measuring performance in your app, pass a function
// // to log results (for example: reportWebVitals(console.log))
// // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();