/*
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export { default as isFirstParty } from './utils/isFirstParty';
export { default as filterFramesWithCookies } from './utils/filterFramesWithCookies';
export { default as filterCookiesByFrame } from './utils/filterCookiesByFrame';
export { default as prepareCookiesCount } from './utils/prepareCookiesCount';
export { default as prepareCookieStatsComponents } from './utils/prepareCookieStatsComponents';
export { default as getCookieKey } from './utils/getCookieKey';
export { default as fetchLocalData } from './utils/fetchLocalData';
export { default as noop } from './utils/noop';
export * from './cookies.types';
export const UNKNOWN_FRAME_KEY = 'Unknown frame(s)';
