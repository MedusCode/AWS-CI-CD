 /*************************************************************************
 * File: speedgolfCacluations.js
 * This file defines constants and functions that are useful for computing
 * speedgolf pars.
 ************************************************************************/
 const parRunPaceMinMen = 7;
 const parRunPaceSecMen = 0;
 export const parRunPaceMen = (parRunPaceMinMen * 60) + parRunPaceSecMen;
 const parRunPaceMinWomen = 9;
 const parRunPaceSecWomen = 0;
 export const parRunPaceWomen = (parRunPaceMinWomen * 60) + parRunPaceSecWomen;
 export const parShotBoxSecMen = 15;
 export const parShotBoxSecWomen = 20;
 const mileDistInFeet = 5280;
 export const samplingDistInFeet = 50;
 
 
 /*********************************************************************
  * @function getHoleTimePar 
  * @desc 
  * Compute time par for a segment of a running path, taking elevation
  * change into account.
  * @param distance -- the distance in feet of the hole
  * @param strokePar -- the stroke par of the hole
  * @param parPace -- the par running pace (in seconds per mile) 
  * @param shotboxTime -- the par time (in seconds) for hitting a shot
  ********************************************************************/
 
 export function getTimePar(distance, strokePar, parPace, shotboxTime) {
     let timepar = distance/mileDistInFeet * parPace; //seconds
     //Add in shotbox times
     timepar += strokePar * shotboxTime;
     return timepar;
 }
 