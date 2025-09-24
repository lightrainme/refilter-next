import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
