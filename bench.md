- node 8.4.0

### before `master`

```
Benchmarking JSON (baseline)
  Running object encoding benchmark...
  Encoded 1000000 objects in 1526 ms (655308 enc/s)

  Running object decoding benchmark...
  Decoded 1000000 objects in 1812 ms (551876 dec/s)

  Running object encoding+decoding benchmark...
  Encoded+decoded 1000000 objects in 3510 ms (284900 enc+dec/s)

Benchmarking protocol-buffers
  Running object encoding benchmark...
  Encoded 1000000 objects in 2326 ms (429923 enc/s)

  Running object decoding benchmark...
  Decoded 1000000 objects in 573 ms (1745201 dec/s)

  Running object encoding+decoding benchmark...
  Encoded+decoded 1000000 objects in 2967 ms (337041 enc+dec/s)
```

### after direct port `encode`


```
Benchmarking JSON (baseline)
  Running object encoding benchmark...
  Encoded 1000000 objects in 1407 ms (710732 enc/s)

  Running object decoding benchmark...
  Decoded 1000000 objects in 1703 ms (587199 dec/s)

  Running object encoding+decoding benchmark...
  Encoded+decoded 1000000 objects in 3281 ms (304785 enc+dec/s)

Benchmarking protocol-buffers
  Running object encoding benchmark...
  Encoded 1000000 objects in 4721 ms (211820 enc/s)

  Running object decoding benchmark...
  Decoded 1000000 objects in 516 ms (1937984 dec/s)

  Running object encoding+decoding benchmark...
  Encoded+decoded 1000000 objects in 5077 ms (196967 enc+dec/s)
```
