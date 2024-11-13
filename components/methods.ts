export function msToMinutesAndSeconds(ms: number) {
   const minutes = Math.floor(ms / 60000);
   const seconds = Math.floor((ms % 60000) / 1000);
   
   return (
      (minutes < 10 ? "0" : "") + minutes + ":" +
      (seconds < 10 ? "0" : "") + seconds
   );
}