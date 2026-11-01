---
title: Digital Playground
pubDate: '2026-04-14'
updated: "2026-05-27T17:52:57+01:00"
author: Will Byrne
category: Software Development
tags:
  - Coding
  - AI
image:
  url: /assets/cyberpark.jpeg
  alt: Cyberpark childrens playground
---

This post is about my [playground repo](https://github.com/will-byrne/playground). I started this repo to help learn some new techniques and technologies.

## History
This repo is not the first playground repo I have made. Way back in October 2019, I set up a [repo](https://github.com/will-byrne/browser-test-playground) for trialling browser testing frameworks. This was due to the one we were using at work at the time having persistent issues with time-outs and inconsistent failures. I decided to mirror a basic client and server using React and Express to mimic what we were using. The plan was to use graphql but we switched to a new framework before that was done. I added different testing frameworks as I discovered them, attempting to test the same things, and I used the repo to work out speed, ease of use and maintainability of each framework to help guide the team's decision.
The repo was largely abandoned after the decision was made, apart from adding a branch for [Playwright](https://playwright.dev/) when I was going to use it to create a test suite for [Libero Editor](https://playwright.dev/)(which is now in maintenance and under new stewardship). I always had plans to revisit this repo to add more frameworks that I had discovered, but I never got around to it.
When I lost my job last year, I decided to start going through my backlog of technologies and created a new playground repo with the idea of using it to help learn those technologies.

## Premise
I decided to have a consistent shape to the data for this repo for all of the technologies that I tried (where possible and necessary). As someone who mostly works in a full-stack web development capacity, I wanted to have a series of clients and servers that could be used interchangeably, and once I had a stable set of each, I wanted to start trying out some infrastructure as code technologies.

I decided to make a simple web app that would allow the user to search for a pokémon and retrieve some basic information about it, and display it to the user. I decided to use [Pokéapi](https://pokeapi.co/) as it is a free API that has a non-trivial data structure and plenty of good wrappers. Part of the fair use policy is to cache the data locally, so I decided to add a storage component using MongoDB. This proved to be a good decision as I needed to make multiple requests to the API from the servers to get the information needed for the client, which made the servers more than simply a data transport between the API, database, and client.

I chose Pokémon because I wanted something fun and light-hearted that would not be confused with production code, also, it's a fun trip down nostalgia lane.

## Technologies
When deciding what technologies to use, I was originally planning to start with a simple `React` client and an `Express` server, both using `TypeScript`. I changed my mind on day 1 when I encountered [Hono](https://hono.dev/), which had somehow slipped by without me noticing, so I switched to using that for my first server. I was planning to start with these because they were familiar technologies that I could use to establish my base contract between client and server and get them both up and running quickly.
The technologies I have implemented so far are:
### Clients:
- [React](https://react.dev/)
- [Mantine](https://mantine.dev/)
- [Lit](https://lit.dev/)
- [Rust](https://rust-lang.org/)
- [Remix](https://remix.run/)
### Servers:
- [Rust](https://rust-lang.org/)
- [Hono](https://hono.dev/)
### Static Site:
- [Astro](https://astro.build/)

### Future Tech to Try:
(In no particular order)
- [Go](https://go.dev/) (server)
- [Phoenix](https://www.phoenixframework.org/) (client)
- [Svelte](https://svelte.dev/) (client)
- [Nix](https://nixos.org/) (infrastructure)
- [Kubernetes](https://kubernetes.io/) (infrastructure)
- [Docker](https://www.docker.com/) (infrastructure)

### AI
Throughout implementing the technologies so far, I have also been trialling different AI utilities. Mostly just [ChatGPT](https://chatgpt.com/), but recently [Copilot](https://github.com/features/copilot), I have used them more extensively to generate the `CSS` and `HTML` because that is less relevant to testing the technologies, but recently in the remix-client, I tried to use Copilot to generate some tests (see below).

## Issues
I encountered some issues while working on this repo, most caused by me.

### Contract
The contract between client and server was very basic at the start, unsurprisingly. This made me feel safe to add more clients and servers, and then I realized my simple contract was not enough for what I wanted to display on the client. This meant having to change 2 servers and 4 clients to match the new data shape. I compounded this by changing it again later to add better error handling, and I still have to update most of the projects to use the latest contract. I was too eager to add new technologies. I got excited when I was reading up on them and just jumped in to start coding when I should have waited and planned when to add each one and ensured that the contract was in a more stable state.

### AI
Using AI has saved me a lot of time but it has also caused a lot of issues, mostly with badly generated code which was worse with ChatGPT than copilot but there was a lot of clean-up needed after each time that I used it and ChatGPT especially sent me down a lot of rabbit holes when I was using it to troubleshoot odd errors I was getting while still learning the technologies. There is still some code that I added using AI that I need to go through and verify, especially in the lit-client and having seen the results of the AI-generated tests, I will be a lot more vigilant when using AI to generate code. Less of an issue and more of an experiment the AI-generated tests for the remix client were created by asking Copilot to create a test suite for remix-client. The results were less than spectacular, almost all of the tests ignored my code and just tested Typescript language features, especially `array.sort` and `array.filter`. This was very dissapointing as testing is something that I am passionate about and I am panning on writting a post about soon.

### Infrastructure
I should have started work on the infrastructure earlier and added one or two infrastructure as code technologies (IAS) before adding so many clients and servers. Adding it now will be more challenging with a more complex array of platforms to run; however, I will probably start to add them with just the rust-server and remix-client, and when I am happy with it add the rest.

## Future Plans
As well as the [Future Tech to Try](#future-tech-to-try), I have tentative plans for when I have added more IAS than simply running the rust-server and MongoDB with Docker Compose to introduce a selector or toggle of some sort to the clients to allow the user to switch which back-end they would like to use.
I would like to deploy these projects to a remote server somewhere on something like [Heroku](https://www.heroku.com/) or [Render](https://render.com/).
The code is also mostly missing good test suites, and especially when I get the IAS up and running, I would like to add extensive e2e tests to the mix before any automated deployment.
The clients and servers, as they currently stand, are very simple. It would be a much better test to add some more complex UX interaction to learn the technologies better and to possibly pull information in from more places in the server, possibly add something that searches for fan art of the pokémon (risky) or even add modals to show more of the pokémon stats and data.


## Experiments
I realied when I looked at my code that I never implemented the svelte-client. I have decided it will be a fun test to see if Copilot when instructed will be able to create something that matches the remix-client functionality. I will run this then report back here when its done with the results. I am not a Svelte developer and so will not be able to comment on the quality of the Svelte code. If it looks ok I may repeat the experiment and see how it fares reproducing the rust-server in Java.
