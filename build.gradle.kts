import org.gradle.api.tasks.testing.logging.TestLogEvent
import org.jetbrains.kotlin.gradle.dsl.KotlinCompile
import org.jetbrains.kotlin.gradle.dsl.KotlinJvmOptions

plugins {
	// Kotlin JVM plugin to target the JVM
	kotlin("jvm")                                   version "1.3.21"

	// By default Kotlin makes classes final which conflicts with Spring which needs classes to be open.
	// The kotlin-spring is a wrapper on top of the all-open plugin.
	// https://kotlinlang.org/docs/reference/compiler-plugins.html#spring-support
	id("org.jetbrains.kotlin.plugin.spring")        version "1.3.21"

	// The Spring Boot Gradle Plugin provides Spring Boot support in Gradle, allowing you to package
	// executable jar or war archives, run Spring Boot applications, and use the dependency management
	// provided by spring-boot-dependencies.
	id("org.springframework.boot")                  version "2.1.3.RELEASE"

	// Code Coverage plugin
	jacoco

	// Kotlin linter
	id("org.jlleitschuh.gradle.ktlint")             version "7.1.0"

	// dependencyUpdates - a task to determine which dependencies have updates
	id("com.github.ben-manes.versions")             version "0.20.0"
}

configure<JavaPluginConvention> {
	group = "com.crypto.koin"
	version = "0.0.1-SNAPSHOT"
	sourceCompatibility = JavaVersion.VERSION_1_8
	targetCompatibility = JavaVersion.VERSION_1_8
}

// Null safety for Kotlin projects through the Spring Initializr:
// https://github.com/spring-io/initializr/issues/591
tasks.withType<KotlinCompile<KotlinJvmOptions>> {
	kotlinOptions {
		freeCompilerArgs = listOf("-Xjsr305=strict")
		jvmTarget = "1.8"
	}
}

repositories {
	mavenCentral()
	jcenter()
}

dependencies {
	// Kotlin libraries
	implementation(platform(kotlin("bom", version = "1.3.21")))
	implementation(kotlin("stdlib-jdk8"))
	implementation(kotlin("reflect"))

	// Spring Boot
	implementation(platform("org.springframework.boot:spring-boot-dependencies:2.1.3.RELEASE"))
	implementation("org.springframework.boot:spring-boot-starter-web")

	// Spring Boot Test
	testImplementation("org.springframework.boot:spring-boot-starter-test") {
		exclude(group = "junit", module = "junit")
	}

	// JUnit 5
	testImplementation(enforcedPlatform("org.junit:junit-bom:5.3.2"))   // use JUnit 5
	testImplementation("org.junit.jupiter:junit-jupiter-api")           // JUnit 5 public API for writing tests and extensions
	testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine")           // JUnit 5 engine to run tests
	testImplementation("org.junit.jupiter:junit-jupiter-params")        // JUnit 5 parameterized tests
}

// Test settings
val test by tasks.getting(Test::class) {
	useJUnitPlatform()  // enable Gradle to run JUnit 5 tests

	// log skipped and failed tests
	testLogging {
		events = setOf(TestLogEvent.SKIPPED, TestLogEvent.FAILED)
	}
}

// execute linter on check
val check: DefaultTask by tasks
val ktlintCheck: DefaultTask by tasks
check.dependsOn(ktlintCheck)
