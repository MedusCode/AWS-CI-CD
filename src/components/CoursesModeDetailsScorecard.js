import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import EditTextModal from './EditTextModal';
import {useCourse, useCourseDispatch} from './CourseContext';
import * as Conversions from '../conversions';
//import * as SGCalcs from '../speedgolfCalculations';
import {useState} from 'react';

 /*************************************************************************
 * File: CoursesModeDetailsScorecard.js
 * This file defines the CoursesModeDetailsScorecard React component, 
 * which enables users to view and edit info on the course's scorecard.
 ************************************************************************/

export default function CoursesModeDetailsScorecard() {
    //{tees, updateCourseVal, numHoles}
    
    const dispatch = useCourseDispatch();
    const course = useCourse();
    const [addEditTeeDialog, setAddEditTeeDialog] = useState({show: false});
    const [selectedTee, setSelectedTee] = 
      useState(Object.keys(course.tees).length === 0 ? null: Object.keys(course.tees)[0]);
    const [distUnits, setDistUnits] = useState({convertToFt: Conversions.yardsToFeet, 
        convertToHoleUnits: Conversions.toYards, convertToTotalUnits: Conversions.toMiles, 
        golfUnitsAbbrev: "yds", runUnitsAbbrev: "mi"});
    const numTabItems = 8;
    
    /*************************************************************************
     * @function handleSlopeRatingDataChange
     * @param e, the event object returned by the event handler
     * @param prop, the property of the slope/rating value being changed
     * @Desc
     * Update the slope/rating property prop to the value entered by the user.
     *************************************************************************/
    function handleSlopeRatingDataChange(e) { 
        let newVal = Number(e.target.value);    
        dispatch({type: "UPDATE_SLOPE_RATING_INFO", tee: selectedTee, propName: e.target.name, propVal: newVal});
    }

    /*************************************************************************
     * @function handleHoleDataChange
     * @param e, the event object returned by the event handler
     * @param holeNum, the hole number being changed
     * @param prop, the property of the hole being changed
     * @param minVal, the minimum value allowed for the property
     * @param maxVal, the maximum value allowed for the property
     * @Desc 
     * If the user is changing the name of the current tee, update that name.
     * Otherwise, add a new tee with name teeName and set it as current tee.
     *************************************************************************/
    function handleHoleDataChange(e, holeNum, prop, minVal, maxVal) {
        let newVal = Number(e.target.value);
        if (newVal < minVal)
          newVal = minVal;
        else if (newVal > maxVal)
          newVal = maxVal;
        dispatch({type: "UPDATE_HOLE_INFO", tee: selectedTee, holeNum: holeNum, propName: prop, propVal: newVal, distUnits: distUnits});
    }

    function autoPopulate(e, holeNum, prop, autoProp) {   
        if ((e.key === "Enter" || e.key === "Tab") && course.tees[selectedTee].holes[holeNum-1][autoProp] === "") {
            if (autoProp === 'runDistance') {
                dispatch({type: "UPDATE_HOLE_INFO", tee: selectedTee, holeNum: holeNum, 
                      propName: autoProp, propVal: distUnits.convertToHoleUnits(course.tees[selectedTee].holes[holeNum-1][prop]), distUnits: distUnits});
            } else {
                dispatch({type: "UPDATE_HOLE_INFO", tee: selectedTee, holeNum: holeNum, 
                      propName: autoProp, propVal: course.tees[selectedTee].holes[holeNum-1][prop], distUnits: distUnits});
            }   
        }
    }

    /*************************************************************************
     * @function handleSelectedTeeChange
     * @param event, the event object returned by the event handler
     * @Desc 
     * Update the selected tee to the tee chosen.
     *************************************************************************/
    function handleSelectedTeeChange(event) {
        setSelectedTee(event.target.value);
    }
    
    /*************************************************************************
     * @function toggleUnits
     * @param event, the event object returned by the event handler
     * @Desc 
     * Set the distance units when the user clicks on "Imperial" or "Metric"
     * radio button.
     *************************************************************************/
    function toggleUnits(event) {
        let dUnits = {}
        if (event.target.value === "Imperial") {
            dUnits.convertToFt = Conversions.yardsToFeet;
            dUnits.convertToHoleUnits = Conversions.toYards;
            dUnits.golfUnitsAbbrev = "yds";
            dUnits.convertToTotalUnits = Conversions.toMiles;
            dUnits.runUnitsAbbrev = "mi";
        } else {
            dUnits.convertToFt = Conversions.metersToFeet;
            dUnits.convertToHoleUnits = Conversions.toMeters;
            dUnits.golfUnitsAbbrev = "m";
            dUnits.convertToTotalUnits = Conversions.toKilometers;
            dUnits.runUnitsAbbrev = "km";
        }
        setDistUnits(dUnits);
    }

    /*************************************************************************
     * @function addEditTee
     * @param teeName, the name of the tee being added or edited
     * @Desc 
     * If the user is changing the name of the current tee, update that name.
     * Otherwise, add a new tee with name teeName and set it as current tee.
     *************************************************************************/
    function addEditTee(teeName) {
        if (addEditTeeDialog.prevTee !== "") {
            dispatch({type: "UPDATE_TEE_NAME", prevTeeName: addEditTeeDialog.prevTee, newTeeName: teeName});
        } else {
            dispatch({type: "ADD_TEE", teeName: teeName});
        }
        setSelectedTee(teeName);
        setAddEditTeeDialog({show: false});
    }

    /*************************************************************************
     * @function cancelAddEditTee
     * @Desc 
     * Close the Add/Edit tee dialog box without making changes.
     *************************************************************************/
    function cancelAddEditTee() {
        setAddEditTeeDialog({show: false});
    }

    /*************************************************************************
     * @function openAddEditTeeDialog
     * @param editing, a boolean indicating whether the user is editing the
     * name of the current tee
     * @Desc 
     * Open a dialog box to allow the user to either edit the current tee's
     * name or add a new tee.
     *************************************************************************/
    function openAddEditTeeDialog(editing) {
        const dialogData = {
            val: (editing ? selectedTee : ""),
            type: "text",
            size: 20,
            emptyAllowed: false,
            disallowed: (course.tees === "" ? [] : Object.keys(course.tees))
        };
        setAddEditTeeDialog({show: true, data: dialogData, prevTee: (editing ? selectedTee : "")});
    }
      
     /*************************************************************************
     * @function getFullScorecard
     * @param h, the array of holes for the current tee
     * @Desc 
     * Return the same array of holes, but include the front 9 totals (OUT), 
     * back 9 (IN) totals, and course totals (TOTAL) in the appropriate places
     * in the array. This is the array that will be displayed in the scorecard.
     *************************************************************************/
    function getFullScorecard(h) {
        let s = [];
        let frontGolfDistance = 0;
        let frontRunDistance = 0;
        let frontMensStrokePar = 0;
        let frontWomensStrokePar = 0;
        let frontMensTimePar = 0;
        let frontWomensTimePar = 0;
        let backGolfDistance = 0;
        let backRunDistance = 0;
        let backMensStrokePar = 0;
        let backWomensStrokePar = 0;
        let backMensTimePar = 0;
        let backWomensTimePar = 0;
        for (let i=0; i < h.length; i++) {
            if (i < 9) {
                frontGolfDistance += h[i].golfDistance === "" ? 0 : h[i].golfDistance;
                frontRunDistance += h[i].runDistance === "" ? 0 : h[i].runDistance;
                frontMensStrokePar += h[i].mensStrokePar === "" ? 0 : h[i].mensStrokePar;
                frontWomensStrokePar += h[i].womensStrokePar === "" ? 0 : h[i].womensStrokePar;
                frontMensTimePar += h[i].mensTimePar === "" ? 0 : h[i].mensTimePar;
                frontWomensTimePar += h[i].womensTimePar === "" ? 0 : h[i].womensTimePar;
                s.push(h[i]);
                if (i === 8 && h.length === 18) {
                    s.push({number: "OUT", golfDistance: frontGolfDistance, runDistance: frontRunDistance,
                    mensStrokePar: frontMensStrokePar, womensStrokePar: frontWomensStrokePar,
                    mensTimePar: frontMensTimePar, womensTimePar: frontWomensTimePar})
                }
            } else {
                backGolfDistance += h[i].golfDistance === "" ? 0 : h[i].golfDistance;
                backRunDistance += h[i].runDistance === "" ? 0 : h[i].runDistance;
                backMensStrokePar += h[i].mensStrokePar === "" ? 0 : h[i].mensStrokePar;
                backWomensStrokePar += h[i].womensStrokePar === "" ? 0 : h[i].womensStrokePar;
                backMensTimePar += h[i].mensTimePar === "" ? 0 : h[i].mensTimePar;
                backWomensTimePar += h[i].womensTimePar === "" ? 0 : h[i].womensTimePar;
                s.push(h[i]);
                if (i === 17 && h.length === 18) {
                    s.push({number: "IN", golfDistance: backGolfDistance, runDistance: backRunDistance,
                            mensStrokePar: backMensStrokePar, womensStrokePar: backWomensStrokePar,
                            mensTimePar: backMensTimePar, womensTimePar: backWomensTimePar});
                }
            }
        }
        s.push({number: "TOTAL", golfDistance: frontGolfDistance + backGolfDistance, 
                runDistance: frontRunDistance + backRunDistance,
                mensStrokePar: frontMensStrokePar + backMensStrokePar,
                womensStrokePar: frontWomensStrokePar + backWomensStrokePar,
                mensTimePar: frontMensTimePar + backMensTimePar, 
                womensTimePar: frontWomensTimePar + backWomensTimePar});
        return s;
    }

    return(
        addEditTeeDialog.show ? 
            <EditTextModal 
                title={addEditTeeDialog.prevTee === "" ? "Add Tee" : "Update Tee Name"} 
                prompt={addEditTeeDialog.prevTee === "" ? "Enter a new tee name:" : "Enter updated name for tee:"} 
                buttonLabel={addEditTeeDialog.prevTee === "" ? "Add" : "Update"}
                data={addEditTeeDialog.data}
                updateData={addEditTee}
                cancelUpdate={cancelAddEditTee} /> :
          <>
            <div className="flex-container-centered centered">
                <div>
                    <label className="form-label" htmlFor="selectedTee">Selected Tee:</label><br></br>
                    <select className="form-select-sm centered" 
                            tabIndex="4"
                            value={selectedTee === null ? "": selectedTee} 
                            id="selectedTee" onChange={handleSelectedTeeChange}>
                        {selectedTee === null ? 
                            <option value="No tees defined">Choose '+' to add a tee</option> :
                        Object.keys(course.tees).map((t) => {
                            return [
                            <option key={t} value={t}>{t}</option>
                            ]
                        })}
                    </select>&nbsp;
                    <button className="btn-theme" aria-label="Add New Tee"
                            tabIndex="5"
                            onClick={()=>openAddEditTeeDialog(false)} title="Add a set of tees">               
                        <FontAwesomeIcon icon="plus"/>
                    </button>&nbsp;
                    {course.tees === "" ? null :
                        <button className="btn-theme" aria-label="Edit Name of Tee"
                            tabIndex="6"
                            onClick={()=>openAddEditTeeDialog(true)} title="Edit name of selected set of tees">               
                        <FontAwesomeIcon icon="edit"/>
                        </button>
                    }
                </div>
                <div>
                    <label>Distance Units:</label>
                        <div className="form-check" role="radiogroup">
                            <input className="centered" 
                                    type="radio" name="Imperial" id="Imperial" 
                                    tabIndex="7"
                                    onChange={toggleUnits}
                                    value="Imperial" checked={distUnits.runUnitsAbbrev=== "mi"} />
                            <label className="form-check-label centered" htmlFor="Imperial">
                                &nbsp;Imperial
                            </label>&nbsp;&nbsp;&nbsp;
                            <input className="centered" 
                                    tabIndex="8"
                                    type="radio" name="Metric" id="Metric" 
                                    onChange={toggleUnits}
                                    value="Metric" checked={distUnits.runUnitsAbbrev === "km"}/>
                            <label className="form-check-label centered" htmlFor="Metric">
                                &nbsp;Metric
                            </label>
                        </div>
                </div>
            </div>
        {selectedTee === null ? null : 
          <> 
            <fieldset className="centered">
                <legend>{"Scorecard for " + selectedTee + " Tees"}</legend>
                <div className="table-responsive">
                  <table className="table table-sm table-striped table-hover">
                    <caption>Table of Hole Info</caption>
                    <thead className="sticky-head">
                        <tr>
                            <th></th>
                            <th scope="col" colSpan="2">Distance</th>
                            <th scope="col" colSpan="2">Golf Par</th>
                            <th scope="col" colSpan="2">Time Par</th>
                            <th scope="col" colSpan="2">Speedgolf Par</th>
                            <th scope="col" colSpan="2">Hole Handicap</th>
                        </tr>
                        <tr>
                        <th scope="col">Hole #</th>
                        <th scope="col" title="Golf distance, as shown on scorecard">Golf&nbsp;<FontAwesomeIcon icon="circle-info"/></th>
                        <th scope="col" title="Running distance, which should include golf distance plus the transition from the previous hole to this hole. Defaults to golf distance." >Running&nbsp;<FontAwesomeIcon icon="circle-info"/></th>
                        <th scope="col" title="Men's stroke par, as shown on scorecard">Men's&nbsp;<FontAwesomeIcon icon="circle-info"/></th>
                        <th scope="col" title="Women's stroke par, as shown on scorecard">Women's&nbsp;<FontAwesomeIcon icon="circle-info"/></th>
                        <th scope="col" title="Men's time par. Computed automatically by multiplying hole's running distance by men's 'par' running pace (7:00/mile) and then adding 'par' shotbox time (15 sec) for each par stroke" >Men's&nbsp;<FontAwesomeIcon icon="circle-info"/></th>
                        <th scope="col" title="Women's time par. Computed automatically by multiplying hole's running distance by women's 'par' running pace (9:00/mile) and then adding 'par' shotbox time (20 sec) for each par stroke" >Women's&nbsp;<FontAwesomeIcon icon="circle-info"/></th>
                        <th scope="col" title="Men's speedgolf par. Computed automatically as sum of stroke and time pars" >Men's&nbsp;<FontAwesomeIcon icon="circle-info"/></th>
                        <th scope="col" title="Women's speedgolf par. Computed automatically as sum of stroke and time pars" >Women's&nbsp;<FontAwesomeIcon icon="circle-info"/></th>
                        <th scope="col" title="Men's hole handicap, as shown on scorecard. This is a measure of difficulty of this hole relative to others on the course.">Men's&nbsp;<FontAwesomeIcon icon="circle-info"/></th>
                        <th scope="col" title="Women's hole handicap, as shown on scorecard. This is a measure of difficulty of this hole relative to others on the course">Women's&nbsp;<FontAwesomeIcon icon="circle-info"/></th>
                        </tr>
                    </thead>
                    <tbody>
                         {getFullScorecard(course.tees[selectedTee].holes).map((h) => { 
                            return [
                            <tr key={h.number}>
                                <th scope="row">{h.number}</th>
                                <td>
                                    {h.number==="OUT" || h.number==="IN" || h.number==="TOTAL" ? (distUnits.convertToHoleUnits(h.golfDistance) + " " + distUnits.golfUnitsAbbrev):
                                    <input type="number" className="dist-width centered"  
                                        tabIndex={numTabItems + (h.number*2)-1} aria-label={"Golf distance for hole " + h.number}
                                        value={distUnits.convertToHoleUnits(h.golfDistance)}                                                    
                                        onChange={(e) => handleHoleDataChange(e,h.number,"golfDistance",1,900)}
                                        onKeyDown={(e) => autoPopulate(e,h.number,"golfDistance","runDistance")} 
                                    />}
                                </td>
                                <td>
                                    {h.number==="OUT" || h.number==="IN" || h.number==="TOTAL" ? (distUnits.convertToTotalUnits(h.runDistance) + " " + distUnits.runUnitsAbbrev) :
                                    <input type="number" className="dist-width centered"  
                                        tabIndex={numTabItems + (h.number*2)} aria-label={"Running distance for hole " + h.number}
                                        value={distUnits.convertToHoleUnits(h.runDistance)}                                                    
                                        onChange={(e) => handleHoleDataChange(e,h.number,"runDistance",1,1500)}/>}
                                </td>
                                <td>
                                    {h.number==="OUT" || h.number==="IN" || h.number==="TOTAL" ? h.mensStrokePar :
                                    <input type="number" className="par-width centered"  value={h.mensStrokePar} 
                                           tabIndex={numTabItems + (course.numHoles*2) + (h.number * 2) - 1} aria-label={"Men's stroke par for hole " + h.number}
                                            onChange={(e) => handleHoleDataChange(e,h.number,"mensStrokePar",3,6)}
                                            onKeyDown={(e) => autoPopulate(e,h.number,"mensStrokePar","womensStrokePar")}
                                    />}
                                </td>
                                <td>
                                    {h.number==="OUT" || h.number==="IN" || h.number==="TOTAL" ? h.womensStrokePar :
                                    <input type="number" className="par-width centered"  value={h.womensStrokePar} 
                                           tabIndex={numTabItems + (course.numHoles*2) + (h.number * 2)} aria-label={"Women's stroke par for hole " + h.number}
                                            onChange={(e) => handleHoleDataChange(e,h.number,"womensStrokePar",3,6)}/>}
                                </td>
                                <td>
                                    {h.number==="OUT" || h.number==="IN" || h.number==="TOTAL" ? Conversions.toTimePar(h.mensTimePar) :
                                    <input type="text" disabled className="time-width centered" 
                                            value={h.mensTimePar === "" ? "" : Conversions.toTimePar(h.mensTimePar)}/>}
                                </td>
                                <td>
                                    {h.number==="OUT" || h.number==="IN" || h.number==="TOTAL" ? Conversions.toTimePar(h.womensTimePar) :
                                    <input type="text" disabled className="time-width centered" 
                                            value={h.womensTimePar === "" ? "" : Conversions.toTimePar(h.womensTimePar)}/>}
                                </td> 
                                <td>
                                    {h.number==="OUT" || h.number==="IN" || h.number==="TOTAL" ? Conversions.toSGPar(h.mensStrokePar, h.mensTimePar) :
                                    <input type="text" disabled className="time-width centered" 
                                            value={Conversions.toSGPar(h.mensStrokePar, h.mensTimePar)}/>}
                                </td>
                                <td>
                                {h.number==="OUT" || h.number==="IN" || h.number==="TOTAL" ? Conversions.toSGPar(h.womensStrokePar, h.womensTimePar) :
                                    <input type="text" disabled className="time-width centered" 
                                            value={Conversions.toSGPar(h.womensStrokePar, h.womensTimePar)}/>}
                                </td> 
                                <td>
                                {h.number==="OUT" || h.number==="IN" || h.number==="TOTAL" ? "" :
                                    <input type="number" className="par-width centered" value={h.mensHandicap} 
                                           tabIndex={numTabItems + (course.numHoles*4) + (h.number * 2) - 1} aria-label={"Men's handicap for hole " + h.number}
                                            onChange={(e) => handleHoleDataChange(e,h.number,"mensHandicap",1,course.numHoles)}
                                            onKeyDown={(e) => autoPopulate(e,h.number,"mensHandicap","womensHandicap")}
                                    />}
                                </td>
                                <td>
                                {h.number==="OUT" || h.number==="IN" || h.number==="TOTAL" ? "" :
                                    <input type="number" className="par-width centered" value={h.womensHandicap} 
                                           tabIndex={numTabItems + (course.numHoles*4) + (h.number * 2)} aria-label={"Women's handicap for hole " + h.number}
                                            onChange={(e) => handleHoleDataChange(e,h.number,"womensHandicap",1,course.numHoles)}/>}
                                </td>                                   
                            </tr>
                            ];

                        })}
                    </tbody>
                </table>
                <table className="table table-sm table-striped table-hover">
                    <caption>Table of Slope and Rating Info</caption>   
                    <thead>
                      <tr>
                        <th scope='col' title="Men's course rating, as listed on scorecard">Men's Course Rating&nbsp;<FontAwesomeIcon icon="circle-info"/></th>
                        <th scope='col' title="Men's course slope, as listed on scorecard">Men's Course Slope&nbsp;<FontAwesomeIcon icon="circle-info"/></th>
                        <th scope='col' title="Women's course slope, as listed on scorecard">Women's Course Rating&nbsp;<FontAwesomeIcon icon="circle-info"></FontAwesomeIcon></th>
                        <th scope='col' title="Women's course slope, as listed on scorecard">Women's Course Slope&nbsp;<FontAwesomeIcon icon="circle-info"></FontAwesomeIcon></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                            <input id="mensRating"
                                   className="form-control centered"
                                   tabIndex={numTabItems + (course.numHoles*6) + 1}
                                   type="number" 
                                   name="mensRating" 
                                   value={course.tees[selectedTee].mensRating} 
                                   aria-label={"Men's course rating for" + selectedTee + " tees"}
                                   onChange={handleSlopeRatingDataChange} />
                        </td>
                        <td>
                            <input id="mensSlope" 
                                   className="form-control centered"
                                   tabIndex={numTabItems + (course.numHoles*6) + 2}
                                   type="number" 
                                   name="mensSlope" 
                                   value={course.tees[selectedTee].mensSlope} 
                                   aria-label={"Men's course slope for" + selectedTee + " tees"}
                                   onChange={handleSlopeRatingDataChange} />
                        </td>
                        <td>
                            <input id="womensRating" 
                                className="form-control centered"
                                tabIndex={numTabItems + (course.numHoles*6) + 3}
                                type="number" 
                                name="womensRating" 
                                value={course.tees[selectedTee].womensRating} 
                                aria-label={"Women's course rating for" + selectedTee + " tees"}
                                onChange={handleSlopeRatingDataChange} />
                        </td>
                        <td>
                            <input id="womensSlope" 
                                   className="form-control centered"
                                   tabIndex={numTabItems + (course.numHoles*6) + 4}
                                   type="number" 
                                   name="womensSlope" 
                                   value={course.tees[selectedTee].womensSlope} 
                                   aria-label={"Women's course slope for" + selectedTee + " tees"}
                                   onChange={handleSlopeRatingDataChange} />
                        </td>
                    </tr>
                    </tbody>
                </table>    
            </div>
          </fieldset> 
        </> }
     </>
    );
}