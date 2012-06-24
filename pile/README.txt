Pile
Dave Cleaver <dscleaver@gmail.com>

SHORT DESCRIPTION

Pile is a language based on the Pi-Calculus. It's design is based on 
the design of Pict which is a strongly typed implementation of the 
Pi-Calculus. Pile is a dynamic language that adopts most of its syntax
from Pict. The basic constructs of the Pi-Calculus are channels and 
processes. Channels represent synchronization points at which 
processes can exchange information. Pile extends the base Pi-Calculus 
by including integers, booleans, and tuples of values among the base 
types. All of these types are encodable in the Pi-Calculus but are 
treated specially by the compiler for convenience and speed.

Pile is largely an experiment driven from my desire to play with the 
Pi-Calculus and my inability to get Pict compiling on my computer. 
This contest provided the perfect opportunity for the experiment.

EXAMPLE

The example below is provided on the live demo page in its entirety.
The process listening on the take channel is defined there.

def stream_primes[r] = 
  (def nums[n out] = (new r1 
     ( +![n 1 r1] | 
       r1?n1 = out!n1 . nums![n1 out] ))
   def filter[n in out] = 
     in?m = (new r1 
       run %![m n r1] 
       new z 
       run r1?remainder = /=![remainder 0 z] 
       z?is_not_zero = if is_not_zero then out!m . filter![n in out] 
                                      else filter![n in out])
   new c new loop 
   run nums![1 c]
   run loop!c
   loop?*in = 
     in?x = r!x.(new c1 (filter![x in c1] | loop!c1)))

new primes run stream_primes![primes]

take![10 primes log]

LICENSE

Pile is released under the MIT license, which is printed below.

Copyright (C) 2012 David S. Cleaver

Permission is hereby granted, free of charge, to any person obtaining 
a copy of this software and associated documentation files 
(the "Software"), to deal in the Software without restriction, 
including without limitation the rights to use, copy, modify, merge, 
publish, distribute, sublicense, and/or sell copies of the Software, 
and to permit persons to whom the Software is furnished to do so, 
subject to the following conditions:

The above copyright notice and this permission notice shall be 
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES 
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS 
BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN 
ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN 
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
SOFTWARE.
