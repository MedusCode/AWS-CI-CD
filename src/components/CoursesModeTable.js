import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import DefaultGolfCoursePic from './../images/DefaultGolfCoursePic.jpg';

 /*************************************************************************
 * File: coursesModeTable.js
 * This file defines the CoursesModeTable React component, which displays
 * the courses in SpeedScore's database that match the current search
 * criteria.
 ************************************************************************/
 export default function CoursesModeTable({coursesToDisplay, numCourses, showCourseDetails}) { 

  return(
    Object.keys(coursesToDisplay).length === 0 ?
    <>  
        <p></p>
        <p className="centered"><i>No courses match search criteria</i></p>
    </> :
    <div className="div-fixed">
      <table id="coursesTable" className="table caption-top mx-auto w-auto">
          <caption id="roundsTableCaption" aria-live="polite" className="caption-center">
            {Object.keys(coursesToDisplay).length === numCourses ? 
              "Displaying all " + numCourses + " golf courses in SpeedScore's database" :
              "Displaying " + Object.keys(coursesToDisplay).length + 
              " golf course(s) meeting search/filter criteria"}
          </caption>
          <thead>
            <tr>
            <th scope="col" aria-label="Course picture"></th>
            <th scope="col" aria-label="Course info"></th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(coursesToDisplay).map((c) => {
                return [
                    <tr key={c} className="d-flex">
                      <td><img src={coursesToDisplay[c].imageUrl === "Default" ? 
                                    DefaultGolfCoursePic : coursesToDisplay[c].imageUrl} 
                               alt={coursesToDisplay[c].shortName} 
                               className="img-fluid img-course" />
                      </td>
                      <td tabIndex="0">
                        <strong>{coursesToDisplay[c].shortName}</strong><br/>
                        {coursesToDisplay[c].address}<br/><br/>
                            <a href={coursesToDisplay[c].website} rel="noreferrer" target="_blank" className="btn btn-sm info-btn">
                                <FontAwesomeIcon icon="globe" />
                                &nbsp;Web
                            </a>
                            <a href={coursesToDisplay[c].mapsUrl} rel="noreferrer" target="_blank" className="btn btn-sm info-btn">
                                <FontAwesomeIcon icon="map"/>
                                &nbsp;Map
                            </a>
                            <a href ={"tel:" + coursesToDisplay[c].phoneNumber} rel="noreferrer" target="_blank" className="btn btn-sm info-btn">
                            <FontAwesomeIcon icon="phone"/>
                            &nbsp;Call
                            </a>
                            <button type="button" className="btn btn-sm info-btn" id={coursesToDisplay[c].id} onClick={() => showCourseDetails(coursesToDisplay[c])}>
                            <FontAwesomeIcon icon="eye"/>
                            &nbsp;Details
                            </button>
                      </td>
                    </tr> 
                ]
            }) }
          </tbody>
    </table>    
    </div>
  );
}