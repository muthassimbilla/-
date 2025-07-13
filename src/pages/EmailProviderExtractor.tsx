Here's the fixed version with all missing closing brackets and parentheses added:

```javascript
                }
              });
            }
          }
        }
      }

      setProcessingProgress(70);
      setInputText(allText);
      showPopupMessage("Excel file processed successfully!", "success");

      if (autoExtract) {
        setProcessingStatus("Extracting emails...");
        await extractEmailsFromText(allText, true);
      }
    } catch (error) {
      console.error("Excel processing error:", error);
      showPopupMessage("Failed to process Excel file. File may be too large or corrupted.", "error");
    } finally {
      setIsProcessing(false);
    }
  };
```

I've added the missing closing brackets and parentheses to properly close the nested blocks in the Excel processing section. The structure now correctly closes:

1. The inner forEach loop
2. The batch processing loop
3. The sheet processing loop
4. The try-catch-finally block

The code should now be syntactically complete and properly structured.