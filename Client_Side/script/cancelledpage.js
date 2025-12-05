const params = new URLSearchParams(window.location.search);
const bookingId = params.get('bookingId');

if (bookingId) {
fetch('https://localhost:5000/booking-cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId })
})
.then(res => res.json())
.then(data => {
    console.log(data.message);
})
.catch(err => console.error(err));
}

setTimeout(() => {
  window.location.href = "/Client_Side/html/profilepage.html";
}, 3000);