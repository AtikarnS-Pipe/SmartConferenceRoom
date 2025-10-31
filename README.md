#!/bin/bash

# admin directory
mkdir conf_admin
cd conf_admin
git init
git remote add origin https://lm.tcctech.us/Intern/ConferenceRoom_SeenYang.git
git checkout -b admin
git pull origin admin
cd Admin
npm install
cd ../..

# backend directory
mkdir conf_backend
cd conf_backend
git init
git remote add origin https://lm.tcctech.us/Intern/ConferenceRoom_SeenYang.git
git checkout -b backend
git pull origin backend
cd be
npm install
cd ../..

# frontend directory
mkdir conf_frontend
cd conf_frontend
git init
git remote add origin https://lm.tcctech.us/Intern/ConferenceRoom_SeenYang.git
git checkout -b frontend
git pull origin frontend
cd fe
npm install
cd ../..
