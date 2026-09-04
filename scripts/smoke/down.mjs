#!/usr/bin/env node
import { compose } from './compose.mjs';

process.exit(compose('down', '-v'));
