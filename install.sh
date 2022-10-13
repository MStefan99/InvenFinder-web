#!/usr/bin/env bash

npm install
npm run build:frontend

docker build -t invenfinder-frontend -f Dockerfile.frontend .
docker build -t invenfinder-backend -f Dockerfile.backend .

kubectl apply -f kube/
