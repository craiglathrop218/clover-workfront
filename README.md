Clover Workfront
=========

A wrapper library to IDT Clover apps for easy access to Workfront data

## Installation

  `npm install clover-workfront`

## Usage

    import {Workfront} from "clover-workfront";

    let issue: Workfront.Issue = await Workfront.getIssueByRefNr(ctx, refNr);

## Tests

## Tagging

    git tag 1.0.2
    git push origin --tags

