# Anki import plan (owner's deck → はなそう)

The owner pulled their personal Anki deck (~1,650 cards) and triaged it in a
phone tool. This is the working plan for folding the kept sentences into
lessons as flashcards. **Nothing is added to lessons.js until the owner sends
the kana export and approves placement.**

## Status / blocker
- Triage tool (Artifact) pre-sorts best-first and pre-marks keep/skip. First
  batch = top tier (★5) = **375 sentences + 100 vocab**.
- 18 sentences were already in the app (exact reading match) → auto-skipped.
- Near-dupe audit: only ~3 true register duplicates + a handful of pattern
  "families" (drill sets) — deck barely overlaps our beginner curriculum.
- **BLOCKER for building cards:** the kept list captured below is the tool's
  *"Copy kept"* (English only). To author `{en, jp, romaji, words}` cards +
  audio we need the *"Copy for Claude"* export (includes the deck kana). Do NOT
  fabricate Japanese — the value is using the owner's actual deck sentences, and
  audio hashes the exact text.

## Placement map (grammar family → existing lesson)

| Sentence type (examples) | Lesson(s) |
|---|---|
| Greetings, thanks, "please come in / take care" | greetings, intro |
| Present adjectives (expensive/cheap/quiet/close/far) | adjectives, na-adj, how-far |
| Past adjectives (was cold/hot/delicious/crowded) | was-were, past-1 |
| Negatives (not tired / not far / isn't a wallet) | negative, adj-negative, past-negative |
| Wants (want to eat/drink/travel/sightsee) | wants |
| Invitations/volitional (Won't you…/Let's…/Shall we…) | lets, making-plans |
| Requests (take off shoes / …could you please / show me) | te-please, te-form |
| Ability/permission (may I try on / can I buy / can't eat anymore) | permission, can-do, potential |
| Experience (ever eaten sukiyaki / have eaten / came 3 times) | experience |
| Question words (Which book/flight/cake is it?) | this-that, where |
| Direction/location (on the left/right / transfer / over there) | directions, where |
| Ordering food/drink (I'll have… / what about drinks / no ice) | cafe, shop |
| Money/counting (how much / 2000 yen / change / one ticket / card) | money, numbers, counters, tickets |
| Travel (by taxi/bus / flight / hotel reservation / breakfast incl.) | transport, does-this-go, travel-trouble |
| Because/reason (because it's nice weather / bus takes time) | because |
| Comparatives (more expensive / which is easier) | comparing |

**Likely new lessons (gaps):**
- **weather / seasons** — nice/bad weather, summer hot, winter cold, "it'll snow".
- **conjecture / hearsay** — "you must be tired" でしょう, "it could be a cold"
  かもしれない, "I heard it'll snow" そう (hearsay). `seems` covers appearance-そう
  only. Confirm the exact split when kana is available.

## Art
Action/object art for the imported sentences is scoped in
`assets/story/ACTION_ART_PROMPTS.md` (drinks, foods, shop objects, avatar
action sheet 2, onsen/aquarium backdrops).

## Next steps (when kana export arrives)
1. Bucket every kept sentence into the lessons above.
2. Write the card entries (en/jp/romaji + word breakdowns).
3. Tag which become interactive action-beats using the new art.
4. Normal deploy ritual: node --check, smoke test, lint, mock sync, version bump.

---

## Kept sentences — first batch (English only, from "Copy kept")
Authoritative kana version pending the "Copy for Claude" export.

1. Is there an English translation?
2. It's popular among Japanese also
3. Who wrote it?
4. Everyone speaks only English. (explaining)
5. Please come to my office
6. The rent is high
7. Where do Tom's parents live?
8. Do you have any siblings?
9. There's another tall person
10. I don't remember
11. May I try them on?
12. Which person is it?
13. It's too tight.
14. Wouldn't you please contact me
15. When will it be returned?
16. I heard it'll snow tomorrow.
17. I want to try going.
18. I like winter sports
19. The fish was delicious
20. I'm accustomed to the cold
21. You don't mind the cold
22. The hot spring is wonderful
23. Please enjoy yourself
24. Please take off your shoes
25. There isn't a wallet
26. I came here three times
27. Which season do you like?
28. Where are they sold?
29. What are they eating?
30. Please watch your step
31. Is it sold here?
32. I'm sorry I'm late.
33. You may be hungry
34. I have eaten
35. Have you ever eaten sukiyaki?
36. I'll have coffee. (informal)
37. Which flight is it?
38. I'm a little tired
39. Does the hotel include breakfast?
40. Are you tired? (formal)
41. Are you tired?
42. My sightseeing bus was delayed.
43. I'd like to do sightseeing
44. I want to have breakfast
45. The room is quiet.
46. You must be tired.
47. There are many ponds
48. The room was comfortable.
49. The tea was delicious
50. I couldn't sleep much
51. I'm not tired
52. What do you recommend today?
53. You'll transfer at Kanda Station
54. It has a long history
55. It's not far
56. Last year's winter was cold
57. It was truly hot
58. Monday was hot, wasn't it?
59. Because it's nice weather
60. It snowed too.
61. Right now I'm self-taught.
62. I want to improve more
63. I'll have green tea.
64. I'll also have coffee.
65. What about drinks?
66. Which do you prefer?
67. I'll have iced tea.
68. Which book is it?
69. It's a Japanese language book
70. Which movie did you see?
71. Which cake will you have?
72. I made a hotel reservation
73. It wasn't cold
74. Was the hotel expensive?
75. Where did you stay?
76. It wasn't expensive.
77. I've already reserved a room.
78. Where shall we eat?
79. Shall we eat sushi today?
80. What shall we eat?
81. Yesterday I was very busy.
82. Today is cool, Isn't it?
83. It's going to become hotter
84. It's warm today.
85. Please bring the water bottle
86. Is it too early?
87. It worked right away.
88. Please take care of yourself.
89. No, there wasn't.
90. Do you have any medicine?
91. Was there any message?
92. It could be a cold.
93. First let's toast
94. I'll be fine tomorrow.
95. I also am hungry.
96. It took time.
97. I like old towns
98. I'm thirsty, too.
99. Was the train crowded?
100. It's that person over there
101. Where at shall we meet?
102. Especially I like jazz
103. Please have some sweets also
104. Please come for a visit
105. I'm going to eat here.
106. May I have some now?
107. Please go ahead.
108. To go, could you please.
109. Cola without ice, please.
110. I'll drink mine without ice.
111. Thankfully, the party went well
112. I don't do much sports.
113. I like non-fiction also.
114. Please give him my regards.
115. Thank you for everything.
116. Let's meet again next year.
117. I don't really want clothes.
118. I had lunch there yesterday.
119. I like it very much
120. Good afternoong / Hello
121. Good evening
122. See you later (casual)
123. Where did you come from?
124. I am studying Japanese
125. Do you understand?
126. Please speak more slowly.
127. What is it in Japanese?
128. It's expensive
129. It's cheap
130. Please show me
131. Please guide me
132. Won't you have tea together/
133. I always drink red wine
134. Well, I don't know yet
135. Won't you have tea?
136. I always drink white wine
137. Your name?
138. Do you drink beer?
139. Can we go by bus?
140. They both speak Japanese
141. Where's the bus stop?
142. Do they both understand Japanese?
143. From whom is it?
144. The e-mail is from whom?
145. Of course that's fine.
146. Let's have a meal
147. I don't want to go
148. Until what time is it?
149. Before the movie, let's eat.
150. I don't travel often
151. And until what time?
152. I don't travel often either.
153. Where do you live? (polite)
154. I always drink it black
155. I don't need sugar either
156. Do you drink it black?
157. Because I drink it black.
158. No, I don't need
159. Where do you work? (polite)
160. Are you free now?
161. I can't eat anymore.
162. It's not hot
163. Is it hot?
164. How's the weather today?
165. There are many interesting places.
166. I want to travel.
167. This cake is delicious
168. Where did you live? (polite)
169. Thank you for the meal
170. How old is your daughter?
171. I left a message.
172. Oh, here it is. (inanimate)
173. Which university is it?
174. Here comes the taxi
175. Is there a problem?
176. It's close
177. It's not very close
178. It's close from here.
179. It's a hundred yen change
180. Is the drug store close?
181. Is it close?
182. One ticket, give me please
183. I'll be waiting here
184. It looks delicious, doesn't it?
185. Everything is delicious
186. Everything is closed, isn't it?
187. The bus is slow
188. Thursday is fine.
189. I sang English songs also
190. I like curry rice too.
191. I'm always busy. (explain)
192. I don't have much cash
193. When will you return?
194. I'm fairly busy tomorrow. (explaining)
195. I have a sweet tooth.
196. There's a bakery also nearby.
197. May I go together
198. Tomorrow's a holiday, isn't it?
199. Where should we meet up?
200. Let's meet up
201. Where should we go?
202. I don't need the map.
203. Because the bus takes time.
204. There's a map too.
205. I'm sorry to be late.
206. Summer is hot.
207. No, it doesn't rain much
208. Winter is very cold.
209. Does it rain?
210. In summer it sometimes rains.
211. I understand Japanese
212. I understand Japanese a little
213. No, I don't understand
214. Do you understand English?
215. It's nice weather, isn't it?
216. See you
217. I don't understand well yet.
218. It's bad weather, isn't it?
219. I understand well
220. I'm not Japanese
221. Thank you very much
222. I don't understand Japanese
223. But I understand Japanese
224. Where is it?
225. It's not over there.
226. It's not here
227. You speak well
228. It's over there for sure.
229. Ueno Station is here
230. Is it here?
231. It's here
232. I'm not going to eat.
233. I'm going to drink something.
234. Won't you eat something?
235. I'm not going to drink
236. I'm going to eat something.
237. Won't you drink something?
238. I also don't speak
239. I'm going to eat later
240. It's fine.
241. Me too
242. I don't want any.
243. I don't want any now.
244. It's all right, for sure.
245. No, thank you
246. At the hotel restaurant
247. I'm going to eat now.
248. Won't you eat together?
249. At what time?
250. I want to eat together
251. I don't want to drink
252. That's fine.
253. I want to eat something
254. I want to drink something
255. What time is it?
256. Won't you drink a beer?
257. Repeat, please.
258. Beer, could you please.
259. Yes, then, at what time?
260. That's fine, for sure.
261. It's four o'clock now.
262. How much is it?
263. See you tomorrow.
264. It's two thousand yen
265. Beer, give me please.
266. How much do you have?
267. Here you are.
268. No, there isn't any.
269. Is there any yakitori?
270. Yes, there is. (inanimate)
271. There isn't sake.
272. Here are five thousand yen.
273. One, give me please.
274. Yes, I can eat.
275. Do you have a lot?
276. Can I buy with card?
277. There are a lot. (inanimate)
278. Where to?
279. For memories, here you are.
280. Where is the aquarium?
281. Are they too small?
282. They are too small.
283. Is it too fast?
284. Can I buy now?
285. Thanks a lot
286. I'd like to have gloves.
287. Slowly, could you please.
288. I'd like to have more
289. It's not expensive, for sure.
290. Can I get some water?
291. This, give me please.
292. More slowly, could you please.
293. Pleased to get acquainted
294. I also live there.
295. Please come in.
296. Where do you live?
297. The toilet is there
298. It's truly expensive.
299. Where is the bathroom?
300. Where does your family live?
301. Is there gas?
302. My car is not big.
303. It's a Japanese car
304. It's not big.
305. Where are you going?
306. There are fifty kilometers
307. Is it a big car?
308. It's far, isn't it?
309. Fill it up, please.
310. The cafe isn't far.
311. It's on the left.
312. It's on the right.
313. Is it on the left?
314. Which is it?
315. No, they're open.
316. Is the mall also closed?
317. Are the stores already closed?
318. Is the restaurant open?
319. It's not open
320. How many days? (informal)
321. I'm going by taxi
322. When are you going back?
323. I'm going back tomorrow night.
324. It's too bad, isn't it?
325. I don't have time.
326. Did you eat something?
327. I want something to drink
328. I like shopping.
329. Did you speak Japanese?
330. That's right, isn't it. (informal)
331. How was the flight? (informal)
332. Nobody was there. (informal)
333. Together with the Japanese students.
334. Who came? (informal)
335. Delicious! (informal)
336. With Japanese students.
337. There are stalls too. (informal)
338. It's delicious, try some! (informal)
339. Last week too. (informal)
340. Everything was delicious. (informal)
341. Japanese class was difficult. (informal)
342. My Japanese class also. (informal)
343. Which was easier? (informal)
344. Just came today. (informal)
345. I don't know well. (informal)
346. I don't know. (informal)
347. About how many? (informal)
348. I'm hungry. (informal)
349. I also am hungry. (informal)
350. The price is different
351. Isn't there deep-fried chicken? (informal)
352. It was more expensive. (informal)
353. There are many islands.
354. If you count small islands.
355. It's famous worldwide too. (informal)
356. The prices are reasonable. (informal)
357. What kinds of tickets? (informal)
358. Is there a refrigerator? (informal)
359. Let's go and see (informal)
360. Seconds, please.
361. You soak in the water
362. Until the water becomes clear.
