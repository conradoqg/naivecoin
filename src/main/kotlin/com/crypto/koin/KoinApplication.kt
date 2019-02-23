package com.crypto.koin

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class KoinApplication

fun main(args: Array<String>) {
    runApplication<KoinApplication>(*args)
}
