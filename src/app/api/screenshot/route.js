import { NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const maxDuration = 60;

export async function POST(request) {
  let browser = null;
  try {
    const { html, width = 1080, height = 1080 } = await request.json();
