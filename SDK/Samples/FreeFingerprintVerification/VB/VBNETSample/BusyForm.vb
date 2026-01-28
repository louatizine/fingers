Imports System
Imports System.Collections.Generic
Imports System.ComponentModel
Imports System.Data
Imports System.Drawing
Imports System.Text
Imports System.Windows.Forms

Namespace Neurotec.Gui
	Public Partial Class BusyForm
		Inherits Form
		Private callback As DoWorkEventHandler
		Private argument As Object
		Private results As RunWorkerCompletedEventArgs
		Private workerError As Exception
		Protected _worker As New BackgroundWorker()

		Private Sub New(ByVal title As String, ByVal callback As DoWorkEventHandler)
			Me.New(title, callback, False, Nothing, Nothing)
		End Sub

		Private Sub New(ByVal title As String, ByVal callback As DoWorkEventHandler, ByVal args As Object)
			Me.New(title, callback, False, args, Nothing)
		End Sub

		Private Sub New(ByVal title As String, ByVal callback As DoWorkEventHandler, ByVal reportsProgress As Boolean)
			Me.New(title, callback, reportsProgress, Nothing, Nothing)
		End Sub

		Private Sub New(ByVal title As String, ByVal callback As DoWorkEventHandler, ByVal reportsProgress As Boolean, ByVal args As Object, ByVal cancelHandler As EventHandler)
			InitializeComponent()

			If Not reportsProgress Then
				progressBar.Style = ProgressBarStyle.Marquee
			End If

			SetExecutionText(title)
			Me.callback = callback
			argument = args
			_worker.WorkerReportsProgress = reportsProgress
			AddHandler _worker.DoWork, AddressOf BusyForm_DoWork
			AddHandler _worker.RunWorkerCompleted, AddressOf BusyForm_RunWorkerCompleted
			AddHandler _worker.ProgressChanged, AddressOf BusyForm_ProgressChanged

			If cancelHandler IsNot Nothing Then
				_worker.WorkerSupportsCancellation = True
				AddHandler btnCancel.Click, cancelHandler
				AddHandler btnCancel.Click, New EventHandler(AddressOf PostOnCancelClick)
				btnCancel.Enabled = True
				btnCancel.Visible = True
			End If
		End Sub

		Private Sub PostOnCancelClick(ByVal sender As Object, ByVal e As EventArgs)
			btnCancel.Enabled = False
			btnCancel.Refresh()
		End Sub

		Public Shared Function RunLongTask(ByVal title As String, ByVal callback As DoWorkEventHandler) As RunWorkerCompletedEventArgs
			Return RunLongTask(title, callback, False)
		End Function

		Public Shared Function RunLongTask(ByVal title As String, ByVal callback As DoWorkEventHandler, ByVal reportsProgress As Boolean) As RunWorkerCompletedEventArgs
			Using frmLongTask As New BusyForm(title, callback, reportsProgress)
				frmLongTask.ShowDialog()
				If frmLongTask.workerError IsNot Nothing Then
					Throw frmLongTask.workerError
				End If
				Return frmLongTask.results
			End Using
		End Function

		Public Shared Function RunLongTask(ByVal title As String, ByVal callback As DoWorkEventHandler, ByVal reportsProgress As Boolean, ByVal args As Object, ByVal cancelHandler As EventHandler) As RunWorkerCompletedEventArgs
			Using frmLongTask As New BusyForm(title, callback, reportsProgress, args, cancelHandler)
				frmLongTask.ShowDialog()
				If frmLongTask.workerError IsNot Nothing Then
					Throw frmLongTask.workerError
				End If
				Return frmLongTask.results
			End Using
		End Function

		Private Sub BusyForm_Shown(ByVal sender As Object, ByVal e As EventArgs)
			_worker.RunWorkerAsync(argument)
		End Sub

#Region "Background worker"
		Private Sub BusyForm_DoWork(ByVal sender As Object, ByVal e As DoWorkEventArgs)
			Try
				callback(sender, e)
			Catch ex As Exception
				workerError = ex
			End Try
		End Sub

		Private Sub BusyForm_ProgressChanged(ByVal sender As Object, ByVal e As ProgressChangedEventArgs)
			Dim text As String = TryCast(e.UserState, String)
			If text IsNot Nothing Then
				SetExecutionText(text)
			End If

			SetExecutionValue(e.ProgressPercentage)
		End Sub

		Private Sub BusyForm_RunWorkerCompleted(ByVal sender As Object, ByVal e As RunWorkerCompletedEventArgs)
			results = e
			Close()
		End Sub
#End Region

		#Region "Setters/Getters"
		Public Delegate Sub StringMethod(ByVal value As String)
		Public Sub SetExecutionText(ByVal text As String)
			Try
				If lblOperation.InvokeRequired Then
					lblOperation.Invoke(DirectCast(AddressOf SetExecutionText, StringMethod))
				Else
					lblOperation.Text = text
				End If
			Finally
			End Try
		End Sub
		Public Delegate Sub IntegerMethod(ByVal value As Integer)
		Public Sub SetExecutionValue(ByVal value As Integer)
			Try
				If progressBar.InvokeRequired Then
					progressBar.Invoke(DirectCast(AddressOf SetExecutionValue, IntegerMethod), value)
				Else
					progressBar.Value = value
				End If
			Finally
			End Try
		End Sub
		#End Region
	End Class
End Namespace
