// JavaScript version of the logger test
// This file can be used if the TypeScript version has issues

import { createLeveledLogger, logger } from "../utils/logger.js";

/**
 * Test file to verify that logger colors are working correctly
 */

// Test the default logger
function testDefaultLogger() {
	logger.debug("Default logger - DEBUG message");
	logger.info("Default logger - INFO message");
	logger.warn("Default logger - WARNING message");
	logger.error("Default logger - ERROR message");
}

// Test component-specific loggers
function testComponentLoggers() {
	// Create loggers for different components
	const buttonLogger = createLeveledLogger("component:button");
	const formLogger = createLeveledLogger("component:form");
	const navLogger = createLeveledLogger("component:nav");

	// Each logger should have a different color based on its namespace
	buttonLogger.debug("Button logger - DEBUG message");
	buttonLogger.info("Button logger - INFO message");
	buttonLogger.warn("Button logger - WARNING message");
	buttonLogger.error("Button logger - ERROR message");

	formLogger.debug("Form logger - DEBUG message");
	formLogger.info("Form logger - INFO message");
	formLogger.warn("Form logger - WARNING message");
	formLogger.error("Form logger - ERROR message");

	navLogger.debug("Nav logger - DEBUG message");
	navLogger.info("Nav logger - INFO message");
	navLogger.warn("Nav logger - WARNING message");
	navLogger.error("Nav logger - ERROR message");
}

// Test feature-specific loggers
function testFeatureLoggers() {
	// Create loggers for different features
	const authLogger = createLeveledLogger("feature:auth");
	const fileLogger = createLeveledLogger("feature:file");
	const settingsLogger = createLeveledLogger("feature:settings");

	// Each logger should have a different color based on its namespace
	authLogger.debug("Auth logger - DEBUG message");
	authLogger.info("Auth logger - INFO message");
	authLogger.warn("Auth logger - WARNING message");
	authLogger.error("Auth logger - ERROR message");

	fileLogger.debug("File logger - DEBUG message");
	fileLogger.info("File logger - INFO message");
	fileLogger.warn("File logger - WARNING message");
	fileLogger.error("File logger - ERROR message");

	settingsLogger.debug("Settings logger - DEBUG message");
	settingsLogger.info("Settings logger - INFO message");
	settingsLogger.warn("Settings logger - WARNING message");
	settingsLogger.error("Settings logger - ERROR message");
}

// Run all tests
function runAllTests() {
	console.log("=== Testing Logger Colors ===");
	testDefaultLogger();
	testComponentLoggers();
	testFeatureLoggers();
	console.log("=== Logger Color Tests Complete ===");
}

// Run the tests
runAllTests();
