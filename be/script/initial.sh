#!/bin/bash

# admindeploy2.0 directory
mkdir conf_admin
cd conf_admin
git init
git remote add origin https://lm.tcctech.us/Intern/ConferenceRoom_SeenYang.git
git checkout -b admindeploy2.0
git pull origin admindeploy2.0
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

# frontenddeploy2.0 directory
mkdir conf_frontend
cd conf_frontend
git init
git remote add origin https://lm.tcctech.us/Intern/ConferenceRoom_SeenYang.git
git checkout -b frontenddeploy2.0
git pull origin frontenddeploy2.0
cd fe
npm install
cd ../..