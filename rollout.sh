#!/usr/bin/env bash

kubectl rollout restart deployment frontend
kubectl rollout restart deployment backend
