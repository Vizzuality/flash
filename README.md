# Flash

Give people instant answers.

## Intro

This app is a node.js server that receives requests from the Twilio
phone service, processes said requests and then either answers calls or
sends messages.

The application is split in two halves: web server and workers. The web
server, found in `lib/web`, responds to Twilio requests at `/voice` and
`/message` with specified messages.

The workers are for responding to messages and are more experimental.
The idea is that we can asynchronously respond to requests for data,
e.g. with machine learning techniques. Currently this is disabled.

## Setup

```
$ npm install
$ supervisor lib/server.js
```

### Twilio connection

Twilio needs an endpoint on the public internet to send requests to for
calls, etc. You can deploy to Heroku (see below), but I use
[ngrok](https://ngrok.com) to forward traffic to a local server.

## General info

## Deployment

Initial setup:

```
git clone git@github.com:vizzuality/flash.git
cd flash

heroku create

# If you're using workers
heroku addons:add mongohq
heroku addons:add cloudamqp

heroku config:set NODE_ENV=production
heroku config:set VIEW_CACHE=true
heroku config:set TWILIO_SID=<sid>
heroku config:set TWILIO_SECRET=<secret>

git push heroku master
heroku open
```

Normal deployment:

```
git push heroku master
```
