/*************************************************************************
 * CourseContext.js
 * This file defines the CourseContext and CourseDispatchContext objects, 
 * which make the course and dispatch variables with child compnents 
 * of CoursesModeDetails through custom useCourse and 
 * useCourseDispatch hooks. In addition, this file defines the
 * CourseProvider component, which, in implementing the Provider pattern,
 * makes the course and dispatch variables available to all 
 * child components of CoursesModeDetails. Finally, the file defines the
 * courseChangeReducer function, which is called by the useReducer hook
 * to update the course object in response actions dispatched by 
 * child components of CoursesModeDetails.
************************************************************************/
import { createContext, useContext, useReducer } from 'react';
import * as SGCalcs from '../speedgolfCalculations.js';

const CourseContext = createContext(null);
const CourseDispatchContext = createContext(null);

export function CourseProvider ({children, initialCourse})  {

    const [course, dispatch] = useReducer(courseChangeReducer, initialCourse);

    return (
        <CourseContext.Provider value={course}>
            <CourseDispatchContext.Provider value={dispatch}>
                {children}
            </CourseDispatchContext.Provider>
        </CourseContext.Provider>
    );
}

export function useCourse() {
    return useContext(CourseContext);
}

export function useCourseDispatch() {
    return useContext(CourseDispatchContext);
}

/*************************************************************************
 * @function courseChangeReducer
 * @param state, the current state of the course
 * @param action, the action to be performed to change the course
 * @Desc
 * This function is called by the useReducer hook to update the course
 * object in response to a change event initiated by the user.
 * @returns the updated course object
 *************************************************************************/
function courseChangeReducer(course, action) {
    const newCourse = JSON.parse(JSON.stringify(course)); //deep copy
    
    /* Note: In "Strict" mode, dispatch functions call the reducer twice 
       to ensure the reducer is a pure function. Read about it here:
       https://github.com/facebook/react/issues/16295
       Without a deep copy, the second call to the reducer 
       will involve a course object that has potentially been modified
    */

    switch(action.type) {
        case "UPDATE_COURSE_INFO": {
            newCourse[action.propName] = action.propVal;
            return newCourse;
        }
        case "UPDATE_SG_INFO": {    
            newCourse[action.propName] = action.propVal;
            const sgRatingFactors = ["sgMembership", "sgRoundDiscount", "sgStandingTeeTimes", "sgPlay"];
            if (newCourse.sgPlay === "sgNotAllowed") {
                newCourse.sgMembership = false;
                newCourse.sgRoundDiscount = false;
                newCourse.sgStandingTeeTimes = false;
                newCourse.sgFriendlinessRating = 0;
                return newCourse;
            }
            if (sgRatingFactors.includes(action.propName)) {
                //Recompute rating
                let rating = 0;
                switch (newCourse.sgPlay) {
                    case "sgAnytime":
                        rating = 3;
                    break;
                    case "sgRegularTeeTimesOnly":
                        rating = 2;
                    break;
                    case "sgSpecialArrangementOnly":
                        rating = 1;
                    break;
                    default:
                    break;
                }
                if (newCourse.sgStandingTeeTimes)
                    rating++;
                if (newCourse.sgMembership || newCourse.sgRoundDiscount)
                    rating++;
                newCourse.sgFriendlinessRating = rating;
            }
            return newCourse;
        }
        case "UPDATE_HOLE_INFO": {
            const newHoles = newCourse.tees[action.tee].holes;
            if (action.propName === 'golfDistance') { //need to convert to feet
                newHoles[action.holeNum-1].golfDistance = action.distUnits.convertToFt(action.propVal);
            } else if (action.propName === 'runDistance') { //need to convert to feet and update time pars
                newHoles[action.holeNum-1].runDistance = action.distUnits.convertToFt(action.propVal);
                  newHoles[action.holeNum-1].mensTimePar = SGCalcs.getTimePar(newHoles[action.holeNum-1].runDistance, newHoles[action.holeNum-1].mensStrokePar, SGCalcs.parRunPaceMen, SGCalcs.parShotBoxSecMen);
                  newHoles[action.holeNum-1].womensTimePar = SGCalcs.getTimePar(newHoles[action.holeNum-1].runDistance, newHoles[action.holeNum-1].womensStrokePar, SGCalcs.parRunPaceWomen, SGCalcs.parShotBoxSecWomen);
            } else if (action.propName === 'mensStrokePar') { //need also to change timePar, which depends on stroke par
                newHoles[action.holeNum-1].mensStrokePar = action.propVal;
                newHoles[action.holeNum-1].mensTimePar = SGCalcs.getTimePar(newHoles[action.holeNum-1].runDistance, newHoles[action.holeNum-1].mensStrokePar, SGCalcs.parRunPaceMen, SGCalcs.parShotBoxSecMen);
            } else if (action.propName === 'womensStrokePar') { //need also to change timePar, which depends on stroke par
                newHoles[action.holeNum-1].womensStrokePar = action.propVal;
                newHoles[action.holeNum-1].womensTimePar = SGCalcs.getTimePar(newHoles[action.holeNum-1].runDistance, newHoles[action.holeNum-1].womensStrokePar, SGCalcs.parRunPaceWomen, SGCalcs.parShotBoxSecWomen);
            }  else {
                newHoles[action.holeNum-1][action.propName] = action.propVal;
            }
           newCourse.tees[action.tee].holes = newHoles;
           return newCourse;
        }
        case "UPDATE_TEE_NAME": {
            newCourse.tees[action.newTeeName] = newCourse.tees[action.prevTeeName];
            newCourse.tees[action.newTeeName].name = action.newTeeName;
            delete newCourse.tees[action.prevTeeName];
            return newCourse;
        }
        case "ADD_TEE" : {
            const newTee = {
                name: action.teeName,
                golfDistance: "",
                runningDistance: "",
                mensStrokePar: "",
                womensStrokePar: "",
                womensTimePar: "",
                mensTimePar: "",
                mensSlope: "",
                womensSlope: "",
                mensRating: "",
                womensRating: "",
                holes: Array.from({length: course.numHoles}, (_, i) => ({
                    number: i+1,
                    name: "",
                    golfDistance: "",
                    runDistance: "",
                    womensHandicap: "",
                    mensHandicap: "",
                    womensStrokePar: "",
                    mensStrokePar: "",
                    womensTimePar: "",
                    mensTimePar: ""
                })),
            };
            newCourse.tees[action.teeName] = newTee;
            return newCourse;
        }
        case "UPDATE_SLOPE_RATING_INFO": {
            newCourse.tees[action.tee][action.propName] = action.propVal;
            return newCourse;
        }   
        default: {
            throw Error('Unknown action: ' + action.type);
        }
    }
}