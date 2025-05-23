Tech and tools used:-

> node.js v22.12 
> express v4.21.2
> mongodb cloud  -  Primary Database
> mongoose v8.9.5  - TO connect to mongodb cloud and perform db operations
> cookie-parser  - to use httponly and samesite options 
> heap-js  - to efficiently sort and arrange users based on their location
> jsonwebtoken - to secure the backend and for user authentaction
> redis -  to cache requests and sotre expired tokens 
> ws - for realtime communication between users.


API design (End Points for each of these):-
> Login 
> Register
> needcash - Fetches and responds with the potential active matches when user chooses needcash service
> needdigital - Fetches and responds with the potential active matches when user chooses needdigital service
> logout


Note:- This app runs on Render free tier. So please expect some delay in api responses and cold starts.
