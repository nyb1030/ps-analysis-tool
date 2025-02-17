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
const sortStringArray = (textArray: string[]): string[] => {
  return textArray.sort((textString1: string, textString2: string) => {
    const trimmedDomainA: string = textString1.replace(/^\./, '').toLowerCase();
    const trimmedDomainB: string = textString2.replace(/^\./, '').toLowerCase();

    if (trimmedDomainA < trimmedDomainB) {
      return -1;
    }
    if (trimmedDomainA > trimmedDomainB) {
      return 1;
    }
    return 0;
  });
};

export default sortStringArray;
